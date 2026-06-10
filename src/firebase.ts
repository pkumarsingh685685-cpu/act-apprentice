import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, setLogLevel } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Debugging logs to verify which config is loaded
console.log("=== FIREBASE INIT DEBUG ===");
console.log("API KEY =", auth.app.options.apiKey);
console.log("PROJECT ID =", auth.app.options.projectId);
console.log("AUTH DOMAIN =", auth.app.options.authDomain);
console.log("STORAGE BUCKET =", auth.app.options.storageBucket);
console.log("FIRESTORE DB ID =", firebaseConfig.firestoreDatabaseId);
console.log("===========================");

// Pass direct database ID from config to avoid querying default db
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

// Suppress internal Firebase warning/info logs (like offline backend reach warnings) from leaking as errors in strict runtimes
try {
  setLogLevel('silent');
} catch (e) {
  console.warn("Failed to set Firestore log-level directly:", e);
}

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
  const errMessage = error instanceof Error ? error.message : String(error);
  
  // Detect if this is genuinely a Firestore security/permission failure
  const isPermissionError = 
    (error && typeof error === 'object' && 'code' in error && error.code === 'permission-denied') ||
    errMessage.toLowerCase().includes('permission') || 
    errMessage.toLowerCase().includes('denied') ||
    errMessage.toLowerCase().includes('deny') ||
    errMessage.toLowerCase().includes('unauthorized') ||
    errMessage.toLowerCase().includes('insufficient');

  const isOfflineError = 
    errMessage.toLowerCase().includes('offline') ||
    errMessage.toLowerCase().includes('backend') ||
    errMessage.toLowerCase().includes('network') ||
    errMessage.toLowerCase().includes('unreachable') ||
    errMessage.toLowerCase().includes('internet') ||
    errMessage.toLowerCase().includes('unavailable') ||
    errMessage.toLowerCase().includes('failed-precondition');

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
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
  };

  if (isPermissionError) {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  } else if (isOfflineError) {
    // Log as a generic warning to keep console output clean from offline errors.
    console.warn('Firestore offline event (gracefully handled):', errMessage);
    throw new Error('Offline: ' + errMessage);
  } else {
    console.error('Firestore General Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }
}
