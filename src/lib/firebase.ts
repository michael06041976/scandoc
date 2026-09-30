import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfigJson) : getApp();

// Initialize Firestore with the provisioned databaseId
export const db = firebaseConfigJson.firestoreDatabaseId && firebaseConfigJson.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Authentication
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Google Sign In helper
export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error during Google sign-in:', error);
    throw error;
  }
}

// Sign Out helper
export async function signOutUser(): Promise<void> {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error during sign-out:', error);
    throw error;
  }
}

// Test connection to Firestore
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified successfully');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client appears offline or config issue:', error.message);
      return false;
    }
    // Any other permission or not-found error still verifies network reachability
    return true;
  }
}

export { onAuthStateChanged };
export type { User };
