import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  auth,
  onAuthStateChanged, 
  signInWithGoogle as firebaseSignIn, 
  signOutUser,
  testFirestoreConnection
} from '../lib/firebase';
import { syncUserProfile } from '../services/firestoreService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  firestoreConnected: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  firestoreConnected: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [firestoreConnected, setFirestoreConnected] = useState(false);

  useEffect(() => {
    // Test connection to Firestore on initialization
    testFirestoreConnection().then(connected => {
      setFirestoreConnected(connected);
    });

    // Listen for Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      setUser(firebaseUser);
      setLoading(false);
      if (firebaseUser) {
        syncUserProfile(firebaseUser);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSignInWithGoogle = async () => {
    try {
      const loggedUser = await firebaseSignIn();
      setUser(loggedUser);
      await syncUserProfile(loggedUser);
    } catch (error) {
      console.error('Sign-in failed:', error);
      throw error;
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setUser(null);
    } catch (error) {
      console.error('Sign-out failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        firestoreConnected,
        signInWithGoogle: handleSignInWithGoogle,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
