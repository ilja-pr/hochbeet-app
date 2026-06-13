import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";
import { getFirebaseApp } from "@/lib/firebase";

// Lazy: getAuth() erst zur Laufzeit aufrufen, nicht beim Modul-Import,
// damit der Build ohne Umgebungsvariablen nicht abbricht.
let _auth: Auth | null = null;
export function getAuthClient(): Auth {
  if (!_auth) _auth = getAuth(getFirebaseApp());
  return _auth;
}

export async function initAuthPersistence() {
  await setPersistence(getAuthClient(), browserLocalPersistence);
}

export async function loginWithEmail(email: string, password: string) {
  await initAuthPersistence();
  return signInWithEmailAndPassword(getAuthClient(), email, password);
}

export async function logout() {
  return signOut(getAuthClient());
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(getAuthClient(), callback);
}

export async function getIdToken(): Promise<string | null> {
  const user = getAuthClient().currentUser;
  if (!user) return null;
  return user.getIdToken();
}
