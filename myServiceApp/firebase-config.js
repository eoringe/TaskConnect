// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'; // Firestore Database
import { getDatabase } from 'firebase/database'; // Realtime Database
import { getStorage } from 'firebase/storage'; // Firebase Storage (optional)

const firebaseConfig = {
  apiKey: "AIzaSyApYZBGEalBlKLuG9Csk-2nhSSHVQB9BYc",
  authDomain: "taskconnect-30e07.firebaseapp.com",
  projectId: "taskconnect-30e07",
  storageBucket: "taskconnect-30e07.firebasestorage.app",
  messagingSenderId: "249705110811",
  appId: "1:249705110811:web:f50b732132894e0e1b87be",
  measurementId: "G-JEJ52055JP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);  // For Authentication
const firestore = getFirestore(app);  // For Firestore
const database = getDatabase(app);  // For Realtime Database
const storage = getStorage(app);  // For Firebase Storage (optional)

export { app, auth, firestore, database, storage };