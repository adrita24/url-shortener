import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCTctyzz1N4Xn3A590gGbrjU05M8WWAXts",
  authDomain: "url-shortener-472b9.firebaseapp.com",
  projectId: "url-shortener-472b9",
  storageBucket: "url-shortener-472b9.firebasestorage.app",
  messagingSenderId: "1047149814232",
  appId: "1:1047149814232:web:8b89f49c2fecd12ba4d2ad",
  measurementId: "G-VVLP5DZ8R6"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();