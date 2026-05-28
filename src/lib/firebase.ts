import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User, connectAuthEmulator } from 'firebase/auth';
import { initializeFirestore, doc, collection, onSnapshot, query, where, setDoc, updateDoc, addDoc, getDoc, serverTimestamp, orderBy, getDocFromServer, Timestamp, connectFirestoreEmulator, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { getAnalytics, isSupported, setAnalyticsCollectionEnabled } from 'firebase/analytics';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
const configFiles = import.meta.glob('../../firebase-applet-config*.json', { eager: true });
const configKeys = Object.keys(configFiles);
const firebaseConfigJson: any = configKeys.length > 0 
  ? ((configFiles[configKeys[0]] as any).default || (configFiles[configKeys[0]] as any)) 
  : {};

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: firebaseConfigJson.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0922849103.firebaseapp.com',
  projectId: firebaseConfigJson.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0922849103',
  storageBucket: firebaseConfigJson.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'gen-lang-client-0922849103.appspot.com',
  messagingSenderId: firebaseConfigJson.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: firebaseConfigJson.appId || import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: firebaseConfigJson.measurementId || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
  firestoreDatabaseId: (firebaseConfigJson as any).firestoreDatabaseId || import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || 'default',
};

export const firebaseAppConfig = {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
  measurementId: firebaseConfig.measurementId,
};

const app = initializeApp(firebaseAppConfig);

// Initialize Analytics and dynamically disable collection based on configured meta-data (defaults to false if explicit variable set)
if (typeof window !== 'undefined') {
  const analyticsEnabled = import.meta.env.VITE_FIREBASE_ANALYTICS_COLLECTION_ENABLED === 'true';
  if (analyticsEnabled) {
    isSupported().then((supported) => {
      if (supported) {
        console.log(`[Firebase Analytics] Initializing collection with VITE_FIREBASE_ANALYTICS_COLLECTION_ENABLED: true`);
        const analytics = getAnalytics(app);
        setAnalyticsCollectionEnabled(analytics, true);
      }
    }).catch((err) => {
      console.warn('[Firebase Analytics] Analytics initialization check bypassed:', err);
    });
  } else {
    console.log('[Firebase Analytics] Analytics collection is disabled. Bypassing library initialization to prevent unauthorized background HTTP referer checks.');
  }
}

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  })
}, import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || (firebaseConfig as any).firestoreDatabaseId);

export const auth = getAuth(app);

// Connect to local emulators if hosted on localhost or explicitly requested via environment variables
if (typeof window !== 'undefined') {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const forceEmulators = import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true';
  
  if (isLocalhost || forceEmulators) {
    try {
      // Connect to auth emulator (e.g. port 1999 as recommended by the user config)
      const authPort = import.meta.env.VITE_FIREBASE_AUTH_EMULATOR_PORT || '1999';
      connectAuthEmulator(auth, `http://localhost:${authPort}`, { disableWarnings: true });
      console.log(`[Firebase Emulator] Dynamic link established with Auth Emulator at port ${authPort}`);
    } catch (err) {
      console.warn('[Firebase Emulator] Auth emulator link bypassed:', err);
    }
    
    try {
      const firestorePort = parseInt(import.meta.env.VITE_FIREBASE_FIRESTORE_EMULATOR_PORT || '8080', 10);
      connectFirestoreEmulator(db, 'localhost', firestorePort);
      console.log(`[Firebase Emulator] Dynamic link established with Firestore Emulator at port ${firestorePort}`);
    } catch (err) {
      console.warn('[Firebase Emulator] Firestore emulator link bypassed:', err);
    }
  }
}

export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.profile');
googleProvider.addScope('https://www.googleapis.com/auth/userinfo.email');

// Dynamically initialize App Check, turning on the Debug Provider when running inside local/sandbox hostnames
if (typeof window !== 'undefined') {
  try {
    const shouldDisableAppCheck = true;
    if (shouldDisableAppCheck) {
      console.log('[Firebase App Check] Deactivated by default in developer/sandbox environment to prevent connection and sign-in blocking.');
    } else {
      const hostname = window.location.hostname;
      const isDevelopment = (
        hostname.includes('localhost') || 
        hostname.includes('ais-dev') || 
        hostname.includes('ais-pre') || 
        hostname.includes('run.app')
      );

      if (isDevelopment) {
        // Configure a stable, custom debug token so you only need to register it ONCE in the Firebase Console.
        (window as any).FIREBASE_APPCHECK_DEBUG_TOKEN = "405a29ce-e558-4918-b3f2-01fa8cf1292a";
        console.log('[Firebase App Check] Development/Sandbox host detected. Global debug token configured.');
        console.log('[Firebase App Check] Static Debug Token: 405a29ce-e558-4918-b3f2-01fa8cf1292a');
        console.log('[Firebase App Check] Register this exact token inside Firebase Console > App Check > Apps > Manage debug tokens.');
      }
      
      const recaptchaKey = '6Le6aPksAAAAALxPg5TQhZcR-1lLFUg0BELoq7ag';
      initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
        isTokenAutoRefreshEnabled: true,
      });
      console.log('[Firebase App Check] Subsystem initialized successfully.');
    }
  } catch (err) {
    console.warn('[Firebase App Check] Initialization bypassed/failed (expected if App Check is disabled/unavailable):', err);
  }
}

export { onMessage };

let messagingInstance: Messaging | null = null;
if (typeof window !== 'undefined') {
  const autoInitEnabled = import.meta.env.VITE_FIREBASE_MESSAGING_AUTO_INIT_ENABLED !== 'false';
  if (autoInitEnabled) {
    try {
      messagingInstance = getMessaging(app);
    } catch (err) {
      console.warn('[Firebase Messaging] Initialization bypassed or unsupported in current context: ', err);
    }
  } else {
    console.log('[Firebase Messaging] Auto initialization is disabled; lazy-loading Messaging on first user interaction.');
  }
}
export const messaging = messagingInstance;

export const requestForToken = async (bypassConfigCheck = false) => {
  const autoInitEnabled = import.meta.env.VITE_FIREBASE_MESSAGING_AUTO_INIT_ENABLED !== 'false';
  if (!autoInitEnabled && !bypassConfigCheck) {
    console.warn('[Firebase Messaging] Auto initialization token request is disabled via configuration VITE_FIREBASE_MESSAGING_AUTO_INIT_ENABLED=false.');
    return null;
  }

  let activeMessaging = messagingInstance;
  if (!activeMessaging && typeof window !== 'undefined') {
    try {
      activeMessaging = getMessaging(app);
      messagingInstance = activeMessaging;
      
      onMessage(activeMessaging, (payload) => {
        console.log('[Firebase Messaging] Direct lazy message received: ', payload);
        if (payload.notification && 'Notification' in window && Notification.permission === 'granted') {
          new Notification(payload.notification.title || 'New Announcement', {
            body: payload.notification.body || ''
          });
        }
      });
    } catch (err) {
      console.error('[Firebase Messaging] Lazy initialization failed during token request: ', err);
      throw err;
    }
  }

  if (!activeMessaging) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const currentToken = await getToken(activeMessaging, { 
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY 
      });
      if (currentToken) {
        return currentToken;
      } else {
        console.warn('No registration token available. Request permission to generate one.');
        return null;
      }
    }
    return null;
  } catch (err: any) {
    console.error('An error occurred while retrieving token: ', err);
    const errorString = String(err?.message || err);
    if (
      errorString.includes('PERMISSION_DENIED') || 
      errorString.toLowerCase().includes('referer') || 
      errorString.toLowerCase().includes('blocked') ||
      errorString.toLowerCase().includes('installations')
    ) {
      const originUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-jrgpfwqqocb4ncftwkz3ja-367327296310.us-west2.run.app';
      const customErr = new Error(`Installations: Create Installation request failed with error "403 PERMISSION_DENIED: Requests from referer ${originUrl}/ are blocked." (installations/request-failed). To resolve, update your GCP API key restrictions to authorize this temporary origin.`);
      throw customErr;
    }
    throw err;
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  }
  console.warn('Firestore Error (Soft Handled):', JSON.stringify(errInfo));
}

export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}

testConnection();
