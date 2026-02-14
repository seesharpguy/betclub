"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore"
import { auth, db, googleProvider } from "@/lib/firebase"

interface AuthContextType {
  user: User | null
  loading: boolean
  isAdmin: boolean
  rejected: boolean
  clearRejection: () => void
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  rejected: false,
  clearRejection: () => {},
  signIn: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [rejected, setRejected] = useState(false)

  const clearRejection = useCallback(() => {
    setRejected(false)
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const email = firebaseUser.email?.toLowerCase()
        if (!email) {
          setRejected(true)
          await firebaseSignOut(auth)
          setUser(null)
          setLoading(false)
          return
        }

        // Check if user is already an admin (admins skip invite check)
        const userRef = doc(db, "users", firebaseUser.uid)
        const userSnap = await getDoc(userRef)
        const admin = userSnap.data()?.isAdmin === true

        if (!admin) {
          // Non-admin must have an invitation
          const inviteRef = doc(db, "invitations", email)
          const inviteSnap = await getDoc(inviteRef)

          if (!inviteSnap.exists()) {
            setRejected(true)
            await firebaseSignOut(auth)
            setUser(null)
            setLoading(false)
            return
          }

          // Accept invitation if pending
          if (inviteSnap.data()?.status === "pending") {
            await updateDoc(inviteRef, { status: "accepted" })
          }
        }

        // Authorized — write user doc
        setUser(firebaseUser)
        setRejected(false)
        setIsAdmin(admin)

        await setDoc(
          userRef,
          {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName ?? "Anonymous",
            email: firebaseUser.email ?? "",
            photoURL: firebaseUser.photoURL ?? null,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        )
      } else {
        setUser(null)
        setIsAdmin(false)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const signIn = async () => {
    await signInWithPopup(auth, googleProvider)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, rejected, clearRejection, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
