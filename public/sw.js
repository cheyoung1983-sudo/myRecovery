importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/11.0.0/firebase-auth-compat.js');

// Parse Firebase configuration from registration query parameters
const swUrlParams = new URL(self.location.href).searchParams;
const swApiKey = swUrlParams.get('apiKey');
const swAuthDomain = swUrlParams.get('authDomain');
const swProjectId = swUrlParams.get('projectId');
const swStorageBucket = swUrlParams.get('storageBucket');
const swMessagingSenderId = swUrlParams.get('messagingSenderId');
const swAppId = swUrlParams.get('appId');

const swFirebaseConfig = {
  apiKey: swApiKey || "",
  authDomain: swAuthDomain || 'gen-lang-client-0922849103.firebaseapp.com',
  projectId: swProjectId || 'gen-lang-client-0922849103',
  storageBucket: swStorageBucket || 'gen-lang-client-0922849103.appspot.com',
  messagingSenderId: swMessagingSenderId || "",
  appId: swAppId || ""
};

// Initialize the Firebase app in the service worker script.
if (swFirebaseConfig.apiKey) {
  try {
    firebase.initializeApp(swFirebaseConfig);
    console.log('[Service Worker Auth] Initialized Firebase with passed config:', swFirebaseConfig.projectId);
  } catch (err) {
    console.warn('[Service Worker Auth] Initialization error or already initialized:', err);
  }
} else {
  console.warn('[Service Worker Auth] No apiKey passed in query parameters, skipping initialization.');
}

const swAuth = firebase.apps.length > 0 ? firebase.auth() : null;

/**
 * Returns a promise that resolves with an ID token if user is signed in and available.
 */
const getIdTokenPromise = () => {
  return new Promise((resolve) => {
    if (!swAuth) {
      resolve(null);
      return;
    }
    const unsubscribe = swAuth.onAuthStateChanged((user) => {
      unsubscribe();
      if (user) {
        user.getIdToken().then((idToken) => {
          resolve(idToken);
        }).catch((err) => {
          console.warn('[Service Worker Auth] Failed to retrieve fresh ID token:', err);
          resolve(null);
        });
      } else {
        resolve(null);
      }
    });
  });
};

const CACHE_NAME = 'sober-spokane-v3'; // Incremented version
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/api/spokane-resources'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  event.waitUntil(clients.claim());
});

const getOriginFromUrl = (url) => {
  const pathArray = url.split('/');
  const protocol = pathArray[0];
  const host = pathArray[2];
  return protocol + '//' + host;
};

// Get underlying body if available. Works for text and json bodies.
const getBodyContent = (req) => {
  return Promise.resolve().then(() => {
    if (req.method !== 'GET') {
      const contentType = req.headers.get('Content-Type') || '';
      if (contentType.indexOf('json') !== -1) {
        return req.json().then((json) => JSON.stringify(json));
      } else {
        return req.text();
      }
    }
  }).catch((error) => {
    console.warn('[Service Worker Auth] Get body content error:', error);
  });
};

self.addEventListener('fetch', (event) => {
  const isSameOrigin = self.location.origin === getOriginFromUrl(event.request.url);
  const isSecure = self.location.protocol === 'https:' || self.location.hostname === 'localhost';

  const requestProcessor = (idToken) => {
    let req = event.request;
    let processRequestPromise = Promise.resolve();

    // For same origin requests, append idToken to headers if signed in.
    if (isSameOrigin && isSecure && idToken) {
      const headers = new Headers();
      req.headers.forEach((val, key) => {
        headers.append(key, val);
      });
      // Add ID token to header
      headers.set('Authorization', 'Bearer ' + idToken);

      processRequestPromise = getBodyContent(req).then((body) => {
        try {
          const requestInit = {
            method: req.method,
            headers: headers,
            mode: req.mode === 'navigate' ? 'same-origin' : req.mode,
            credentials: req.credentials,
            cache: req.cache,
            redirect: req.redirect,
            referrer: req.referrer,
          };
          if (body !== undefined) {
            requestInit.body = body;
          }
          req = new Request(req.url, requestInit);
        } catch (e) {
          console.warn('[Service Worker Auth] Failed to customize request headers:', e);
        }
      });
    }

    return processRequestPromise.then(() => {
      // Apply caching/fetching logic:
      // Only handle GET requests and bypass dynamic APIs/third-party backends
      if (
        req.method !== 'GET' || 
        (req.url.includes('/api/') && !req.url.includes('/api/spokane-resources')) ||
        req.url.includes('firestore.googleapis.com') ||
        req.url.includes('google-analytics.com') ||
        req.url.includes('firebase')
      ) {
        return fetch(req);
      }

      const url = new URL(req.url);

      // STRATEGY: Network-First for the main HTML / Root to ensure users get updates fast
      if (url.origin === self.location.origin && (url.pathname === '/' || url.pathname === '/index.html')) {
        return fetch(req)
          .then((response) => {
            if (response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(req, responseToCache));
            }
            return response;
          })
          .catch(() => caches.match(req)); // Fallback to cache if offline
      }

      // STRATEGY: Cache-First for static assets and allowed CORS resources (like CDNs)
      return caches.match(req).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(req).then((response) => {
          if (response && response.status === 200 && (response.type === 'basic' || response.type === 'cors')) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseToCache);
            });
          }
          return response;
        }).catch((err) => {
          console.warn('[Service Worker] Fetch exception bypassed for:', req.url, err);
          throw err;
        });
      });
    });
  };

  // Fetch the resource after checking for the ID token.
  event.respondWith(
    getIdTokenPromise()
      .then(requestProcessor)
      .catch((err) => {
        console.warn('[Service Worker Auth] ID Token fetch failure, continuing without token:', err);
        return requestProcessor(null);
      })
      .catch((err) => {
        console.error('[Service Worker Auth] Fetch processing failed altogether, falling back to network:', err);
        return fetch(event.request);
      })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Grab target URL from push data, fallback to root path
  const targetPath = event.notification.data || '/';
  const targetUrl = new URL(targetPath, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if a tab with this app is already open
      for (const client of clientList) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // If not open, navigate an open client or open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'myRecovery Update', body: event.data ? event.data.text() : 'You have a new update.' };
  }

  const title = data.title || 'myRecovery Notification';
  const options = {
    body: data.body || 'You have a new update.',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: data.url || '/' // Pass deep-link URL into notification metadata
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
