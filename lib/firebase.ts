import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAuth, GoogleAuthProvider, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

function getFirebaseApp(): FirebaseApp {
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig)
}

let _app: FirebaseApp
let _auth: Auth
let _db: Firestore
let _googleProvider: GoogleAuthProvider

if (typeof window !== "undefined") {
  _app = getFirebaseApp()
  _auth = getAuth(_app)
  _db = getFirestore(_app)
  _googleProvider = new GoogleAuthProvider()
}

export {
  _app as app,
  _auth as auth,
  _db as db,
  _googleProvider as googleProvider,
}
