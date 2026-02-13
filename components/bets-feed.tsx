"use client"

import { useEffect, useState } from "react"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Bet } from "@/lib/types"
import { BetCard } from "@/components/bet-card"
import { CreateBetDialog } from "@/components/create-bet-dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/lib/auth-context"
import { Receipt } from "lucide-react"

export function BetsFeed() {
  const { user } = useAuth()
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "bets"), orderBy("createdAt", "desc"))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Bet[]
      setBets(data)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  const openBets = bets.filter((b) => b.status === "open")
  const myBets = bets.filter(
    (b) => b.creatorId === user?.uid || b.takerId === user?.uid
  )
  const activeBets = myBets.filter(
    (b) => b.status === "taken" || b.status === "pending_resolution"
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bets</h1>
          <p className="text-sm text-muted-foreground">
            Browse open bets or create your own.
          </p>
        </div>
        <CreateBetDialog />
      </div>

      <Tabs defaultValue="open">
        <TabsList>
          <TabsTrigger value="open">
            {"Open (" + openBets.length + ")"}
          </TabsTrigger>
          <TabsTrigger value="active">
            {"My Active (" + activeBets.length + ")"}
          </TabsTrigger>
          <TabsTrigger value="mine">
            {"All Mine (" + myBets.length + ")"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="mt-4">
          {loading ? (
            <BetListSkeleton />
          ) : openBets.length === 0 ? (
            <EmptyState message="No open bets yet. Be the first to create one!" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {openBets.map((bet) => (
                <BetCard key={bet.id} bet={bet} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="mt-4">
          {loading ? (
            <BetListSkeleton />
          ) : activeBets.length === 0 ? (
            <EmptyState message="No active bets. Take an open bet to get started!" />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {activeBets.map((bet) => (
                <BetCard key={bet.id} bet={bet} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="mine" className="mt-4">
          {loading ? (
            <BetListSkeleton />
          ) : myBets.length === 0 ? (
            <EmptyState message="You haven't created or taken any bets yet." />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {myBets.map((bet) => (
                <BetCard key={bet.id} bet={bet} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function BetListSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-36 rounded-lg" />
      ))}
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
      <Receipt className="h-10 w-10 text-muted-foreground" />
      <p className="mt-3 text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
