// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"
import { getStorage } from "firebase/storage"
import { getAnalytics } from "firebase/analytics"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDk5-PHFdQb6xvL0XzMarc8BzQakEJpdzw",
  authDomain: "jbrc-d703a.firebaseapp.com",
  projectId: "jbrc-d703a",
  storageBucket: "jbrc-d703a.appspot.com",
  messagingSenderId: "604591816859",
  appId: "1:604591816859:web:e1614917bbd8aff9b5863e",
  measurementId: "G-CD4T4NJ5HG",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase services
export const db = getFirestore(app)

// Enable offline persistence with error handling
if (typeof window !== 'undefined') {
  import('firebase/firestore').then(({ enableIndexedDbPersistence }) => {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('The current browser does not support offline persistence');
      }
    });
  });
}

export const auth = getAuth(app)
export const storage = getStorage(app)

// Initialize Analytics (only on client side)
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null

export default app;
export { app };
