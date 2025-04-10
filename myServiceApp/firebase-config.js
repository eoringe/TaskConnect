import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyApYZBGEalBlKLuG9Csk-2nhSSHVQB9BYc",
  authDomain: "taskconnect-30e07.firebaseapp.com",
  projectId: "taskconnect-30e07",
  storageBucket: "taskconnect-30e07.firebasestorage.app",
  messagingSenderId: "249705110811",
  appId: "1:249705110811:web:f50b732132894e0e1b87be",
  measurementId: "G-JEJ52055JP",
  databaseURL: "https://taskconnect-30e07-default-rtdb.firebaseio.com", // Optional, only if you're using 
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
// Optional: const database = getDatabase(app);

export { app, auth, firestore, GoogleAuthProvider, signInWithCredential };
