import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface CreateNotificationData {
  type: "bet_created" | "bet_taken"
  betId: string
  betDescription: string
  betAmount: number
  creatorName: string
  creatorPhoto: string | null
  takerName?: string | null
  takerPhoto?: string | null
}

/**
 * Creates a notification document in Firestore.
 * These notifications can be consumed by external services (e.g., Teams notifier).
 */
export async function createNotification(data: CreateNotificationData): Promise<void> {
  try {
    await addDoc(collection(db, "notifications"), {
      type: data.type,
      betId: data.betId,
      betDescription: data.betDescription,
      betAmount: data.betAmount,
      creatorName: data.creatorName,
      creatorPhoto: data.creatorPhoto,
      takerName: data.takerName ?? null,
      takerPhoto: data.takerPhoto ?? null,
      createdAt: serverTimestamp(),
      processed: false,
    })
  } catch (error) {
    console.error("Failed to create notification:", error)
    // Don't throw - we don't want notification failures to break the main flow
  }
}
