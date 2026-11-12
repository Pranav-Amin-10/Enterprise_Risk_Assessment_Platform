import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDrpdkpCBVQEvMqzJYbetZHHcvuUg6HbRc",
  authDomain: "personal-projects-82ee7.firebaseapp.com",
  projectId: "personal-projects-82ee7",
  storageBucket: "personal-projects-82ee7.firebasestorage.app",
  messagingSenderId: "167410186431",
  appId: "1:167410186431:web:0bd2d66d5534b26e436e0a",
  measurementId: "G-5LJCE13QJV"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize and Export Firebase Auth
export const auth = getAuth(app);
export default app;
