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
  push?: boolean
  paidOut?: boolean
}

export interface Invitation {
  email: string
  invitedBy: string
  invitedByName: string
  createdAt: Timestamp | null
  status: "pending" | "accepted"
}

export interface Notification {
  id: string
  type: "bet_created" | "bet_taken"
  betId: string
  betDescription: string
  betAmount: number
  creatorName: string
  creatorPhoto: string | null
  takerName: string | null
  takerPhoto: string | null
  createdAt: Timestamp | null
  processed: boolean
}
