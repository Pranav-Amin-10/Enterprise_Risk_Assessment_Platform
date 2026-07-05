import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDuSUjSISpJ6X_suAJHdQIeEd8vtRytRcQ",
  authDomain: "enterprise-risk-assessme-96510.firebaseapp.com",
  projectId: "enterprise-risk-assessme-96510",
  storageBucket: "enterprise-risk-assessme-96510.firebasestorage.app",
  messagingSenderId: "583762395201",
  appId: "1:583762395201:web:30cf4516e677175f1186c0",
  measurementId: "G-JCKEKJYJ5W"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize and Export Firebase Auth
export const auth = getAuth(app);
export default app;
