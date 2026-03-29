import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC-_aiyna5INqc4ag6_7Uo9zZCahojon2c",
  authDomain: "deliveryec-e23c8.firebaseapp.com",
  projectId: "deliveryec-e23c8",
  storageBucket: "deliveryec-e23c8.firebasestorage.app",
  messagingSenderId: "1099119077736",
  appId: "1:1099119077736:web:d6c24ce9c2fcb55ec88edd",
  measurementId: "G-N6ECWCFRXZ"
};

// Singleton pattern to ensure Firebase is only initialized once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Only initialize analytics on the client side
let analytics = null;
if (typeof window !== "undefined") {
  isSupported().then(yes => yes ? analytics = getAnalytics(app) : null);
}

export { app, auth, db, storage, analytics };
