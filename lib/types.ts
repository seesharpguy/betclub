import type { Timestamp } from "firebase/firestore"

export interface Bet {
  id: string
  creatorId: string
  creatorName: string
  creatorPhoto: string | null
  takerId: string | null
  takerName: string | null
  takerPhoto: string | null
  description: string
  amount: number
  status: "open" | "taken" | "pending_resolution" | "settled"
  winnerId: string | null
  declaredBy: string | null
  confirmedBy: string | null
  createdAt: Timestamp | null
  settledAt: Timestamp | null
}
