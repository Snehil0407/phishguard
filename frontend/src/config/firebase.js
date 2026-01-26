// Firebase configuration and initialization
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBAWiTUG8TUC7yJRy_dyLcAA-HILMVIT_c",
  authDomain: "phishguard-846d1.firebaseapp.com",
  projectId: "phishguard-846d1",
  storageBucket: "phishguard-846d1.firebasestorage.app",
  messagingSenderId: "185249870288",
  appId: "1:185249870288:web:569c40442d1c72b334c9d5",
  measurementId: "G-F8MKSSEF0L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, analytics, auth, db };
