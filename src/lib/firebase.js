import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  initializeFirestore,
  persistentMultipleTabManager,
  persistentLocalCache
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBKcdgIq9HhYXwHBCF9YdrwP3E5I529x9Q",
  authDomain: "update-dai-dyo-lyo.firebaseapp.com",
  projectId: "update-dai-dyo-lyo",
  storageBucket: "update-dai-dyo-lyo.firebasestorage.app",
  messagingSenderId: "542274167454",
  appId: "1:542274167454:web:0eb87c8ced43921099118f",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ✅ Old wala hatao - enableMultiTabIndexedDbPersistence DEPRECATED hai
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export { auth, db, app };