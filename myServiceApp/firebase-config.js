import { initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

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

export { app, auth, firestore };
