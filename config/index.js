// Import the functions you need from the SDKs you need
import app from 'firebase/compat/app';
import "firebase/compat/auth";
import "firebase/compat/database";
import "firebase/compat/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAFdbK7esnhlkjAqGArSnXS8RPtOVobLpM",
  authDomain: "tp-mobile-whats.firebaseapp.com",
  databaseURL: "https://tp-mobile-whats-default-rtdb.firebaseio.com",
  projectId: "tp-mobile-whats",
  storageBucket: "tp-mobile-whats.appspot.com",
  messagingSenderId: "1003000952098",
  appId: "1:1003000952098:web:3b3de815d295ccdc2f617b"
};

// Initialize Firebase

const firebaseApp = app.initializeApp(firebaseConfig);
export default firebaseApp;
