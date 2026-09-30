import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';
import { InvoiceDocument, Supplier } from '../types';

export interface ChatHistoryMessage {
  id?: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  model?: string;
}

// Save or sync user profile
export async function syncUserProfile(user: User): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName || 'User',
      email: user.email || '',
      photoURL: user.photoURL || '',
      role: 'Finance Officer',
      lastLoginAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to sync user profile to Firestore:', err);
  }
}

// Save or update an invoice status in Firestore for the current user
export async function saveInvoiceToFirestore(userId: string, invoice: InvoiceDocument): Promise<void> {
  try {
    const invRef = doc(db, 'users', userId, 'invoices', invoice.id);
    // Sanitize to clean any undefined values for Firestore
    const dataToSave = JSON.parse(JSON.stringify(invoice));
    dataToSave.updatedAt = new Date().toISOString();
    await setDoc(invRef, dataToSave, { merge: true });
  } catch (err) {
    console.error('Failed to save invoice to Firestore:', err);
  }
}

// Load user's saved invoices from Firestore
export async function loadUserInvoicesFromFirestore(userId: string): Promise<Record<string, Partial<InvoiceDocument>>> {
  try {
    const invoicesCol = collection(db, 'users', userId, 'invoices');
    const snapshot = await getDocs(invoicesCol);
    const result: Record<string, Partial<InvoiceDocument>> = {};
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      result[docSnap.id] = data as Partial<InvoiceDocument>;
    });
    return result;
  } catch (err) {
    console.error('Failed to load user invoices from Firestore:', err);
    return {};
  }
}

// Save a chat message to Firestore
export async function saveChatMessageToFirestore(
  userId: string, 
  message: { role: 'user' | 'model'; content: string; model?: string }
): Promise<string | null> {
  try {
    const chatCol = collection(db, 'users', userId, 'chatMessages');
    const docRef = await addDoc(chatCol, {
      userId,
      role: message.role,
      content: message.content,
      model: message.model || 'gemini-3.5-flash',
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (err) {
    console.error('Failed to save chat message to Firestore:', err);
    return null;
  }
}

// Load chat messages from Firestore
export async function loadChatMessagesFromFirestore(userId: string): Promise<ChatHistoryMessage[]> {
  try {
    const chatCol = collection(db, 'users', userId, 'chatMessages');
    const q = query(chatCol, orderBy('timestamp', 'asc'));
    const snapshot = await getDocs(q);
    const messages: ChatHistoryMessage[] = [];
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      messages.push({
        id: docSnap.id,
        role: data.role as 'user' | 'model',
        content: data.content,
        timestamp: data.timestamp || new Date().toISOString(),
        model: data.model
      });
    });
    return messages;
  } catch (err) {
    console.error('Failed to load chat messages from Firestore:', err);
    return [];
  }
}

// Clear chat history in Firestore
export async function clearChatMessagesInFirestore(userId: string): Promise<void> {
  try {
    const chatCol = collection(db, 'users', userId, 'chatMessages');
    const snapshot = await getDocs(chatCol);
    const batch = writeBatch(db);
    snapshot.docs.forEach((docSnap) => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  } catch (err) {
    console.error('Failed to clear chat messages in Firestore:', err);
  }
}

// Save or update a supplier in Firestore for the current user
export async function saveSupplierToFirestore(userId: string, supplier: Supplier): Promise<void> {
  try {
    const supRef = doc(db, 'users', userId, 'suppliers', supplier.id);
    await setDoc(supRef, {
      ...supplier,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save supplier to Firestore:', err);
  }
}

// Load user's saved suppliers from Firestore
export async function loadUserSuppliersFromFirestore(userId: string): Promise<Record<string, Supplier>> {
  try {
    const suppliersCol = collection(db, 'users', userId, 'suppliers');
    const snapshot = await getDocs(suppliersCol);
    const result: Record<string, Supplier> = {};
    snapshot.forEach(docSnap => {
      result[docSnap.id] = docSnap.data() as Supplier;
    });
    return result;
  } catch (err) {
    console.error('Failed to load user suppliers from Firestore:', err);
    return {};
  }
}

// Delete a supplier from Firestore
export async function deleteSupplierFromFirestore(userId: string, supplierId: string): Promise<void> {
  try {
    const supRef = doc(db, 'users', userId, 'suppliers', supplierId);
    await deleteDoc(supRef);
  } catch (err) {
    console.error('Failed to delete supplier from Firestore:', err);
  }
}

