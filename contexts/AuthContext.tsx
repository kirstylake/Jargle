import { onAuthStateChanged } from "firebase/auth";
import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { auth } from "../firebase";
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { User } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
}

export const AuthContext = createContext<AuthContextType>({ user: null });

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);


interface AuthContextProviderProps {
  children: ReactNode; // Accepts any valid React child/children
}

export function AuthContextProvider({ children }: AuthContextProviderProps) {
  const [user, setUser] = useState<User | null>(null); // User type from Firebase or null

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user ? user : null);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user,
      auth,
      }}>
      {children}
    </AuthContext.Provider>
  );
}
export default AuthContextProvider
