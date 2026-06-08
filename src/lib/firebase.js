import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableMultiTabIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBKcdgIq9HhYXwHBCF9YdrwP3E5I529x9Q",
  authDomain: "update-dai-dyo-lyo.firebaseapp.com",
  projectId: "update-dai-dyo-lyo",
  storageBucket: "update-dai-dyo-lyo.firebasestorage.app",
  messagingSenderId: "542274167454",
  appId: "1:542274167454:web:0eb87c8ced43921099118f",
  measurementId: "G-5GXG7C8EKH"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

enableMultiTabIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    console.warn("Firebase persistence: Multiple tabs open.");
  } else if (err.code === "unimplemented") {
    console.warn("Firebase persistence: Browser not supported.");
  }
});

export { auth, db, app };
