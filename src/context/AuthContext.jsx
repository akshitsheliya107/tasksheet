import React, { createContext, useContext, useState, useEffect } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { auth } from "../lib/firebase";
import { setUserId } from "../services/api";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userReady, setUserReady] = useState(false); // ✅ NEW

  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    setUserId("");
    setUserReady(false);
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // ✅ Pehle userId set karo
        setUserId(user.uid);
        console.log("[AUTH] ✅ User logged in:", user.uid);
        
        // ✅ Phir user state set karo
        setCurrentUser(user);
        
        // ✅ Thoda wait karo (auth token propagate hone do)
        await new Promise(resolve => setTimeout(resolve, 300));
        setUserReady(true);
      } else {
        setUserId("");
        setUserReady(false);
        setCurrentUser(null);
        console.log("[AUTH] ❌ User logged out");
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = { 
    currentUser, 
    userReady,  // ✅ Export ye bhi
    login, 
    signup, 
    logout 
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}