import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const config = {
  apiKey: "AIzaSyBIB_J8jOycg0HxE2cyrqlgTppBMpnWQlg",
  authDomain: "act-apprentice-64381.firebaseapp.com",
  databaseURL: "https://act-apprentice-64381-default-rtdb.firebaseio.com",
  projectId: "act-apprentice-64381",
  storageBucket: "act-apprentice-64381.firebasestorage.app",
  messagingSenderId: "34816060930",
  appId: "1:34816060930:web:2fbacdd09187500bfdc11b"
};

export const app = initializeApp(config);
export const auth = getAuth(app);

// Debugging logs to verify which config is loaded
console.log("=== FIREBASE INIT DEBUG ===");
console.log("API KEY =", auth.app.options.apiKey);
console.log("PROJECT ID =", auth.app.options.projectId);
console.log("AUTH DOMAIN =", auth.app.options.authDomain);
console.log("===========================");

export const db = getFirestore(app);
export const storage = getStorage(app);
