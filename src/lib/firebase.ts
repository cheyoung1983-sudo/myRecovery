import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { initializeFirestore, doc, collection, onSnapshot, query, where, setDoc, updateDoc, addDoc, getDoc, serverTimestamp, orderBy, getDocFromServer, Timestamp } from 'firebase/firestore';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { getAnalytics, isSupported, setAnalyticsCollectionEnabled } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfig.measurementId,
};

const app = initializeApp(config);

// Initialize Analytics and dynamically disable collection based on configured meta-data (defaults to false if explicit variable set)
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      const analyticsEnabled = import.meta.env.VITE_FIREBASE_ANALYTICS_COLLECTION_ENABLED === 'true';
      console.log(`[Firebase Analytics] Initializing collection with VITE_FIREBASE_ANALYTICS_COLLECTION_ENABLED: ${analyticsEnabled}`);
      const analytics = getAnalytics(app);
      setAnalyticsCollectionEnabled(analytics, analyticsEnabled);
    }
  }).catch((err) => {
    console.warn('[Firebase Analytics] Analytics initialization check bypassed:', err);
  });
}

export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || (firebaseConfig as any).firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/calendar');

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
  } catch (err) {
    console.error('An error occurred while retrieving token: ', err);
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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
