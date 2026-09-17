// Reserved for the future submission site; not imported by the public calendar.
import { initializeApp } from 'firebase/app'
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
export function createFirebaseServices(config) {
  const app = initializeApp(config)
  return { auth: getAuth(app), db: getFirestore(app) }
}
export function signInWithGoogle(auth) {
  return signInWithPopup(auth, new GoogleAuthProvider())
}
export { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged }
