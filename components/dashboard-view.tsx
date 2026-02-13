"use client"

import { useEffect, useState } from "react"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "@/lib/router-context"
import type { Bet } from "@/lib/types"
import { LedgerTable, type LedgerEntry } from "@/components/ledger-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { TrendingUp, TrendingDown, Scale, Receipt } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

function computeLedger(bets: Bet[], userId: string): LedgerEntry[] {
  const map = new Map<
    string,
    {
      opponentName: string
      opponentPhoto: string | null
      betsWon: number
      betsLost: number
      netBalance: number
    }
  >()

  for (const bet of bets) {
    if (bet.status !== "settled" || !bet.winnerId) continue

    const isCreator = bet.creatorId === userId
    const isTaker = bet.takerId === userId
    if (!isCreator && !isTaker) continue

    const opponentId = isCreator ? bet.takerId! : bet.creatorId
    const opponentName = isCreator
      ? bet.takerName ?? "Unknown"
      : bet.creatorName
    const opponentPhoto = isCreator ? bet.takerPhoto : bet.creatorPhoto

    const existing = map.get(opponentId) ?? {
      opponentName,
      opponentPhoto,
      betsWon: 0,
      betsLost: 0,
      netBalance: 0,
    }

    if (bet.winnerId === userId) {
      existing.betsWon += 1
      existing.netBalance += bet.amount
    } else {
      existing.betsLost += 1
      existing.netBalance -= bet.amount
    }

    existing.opponentName = opponentName
    existing.opponentPhoto = opponentPhoto ?? existing.opponentPhoto
    map.set(opponentId, existing)
  }

  return Array.from(map.entries())
    .map(([opponentId, data]) => ({ opponentId, ...data }))
    .sort((a, b) => b.netBalance - a.netBalance)
}

export function DashboardView() {
  const { user } = useAuth()
  const { navigate } = useRouter()
  const [bets, setBets] = useState<Bet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    const q1 = query(
      collection(db, "bets"),
      where("creatorId", "==", user.uid)
    )
    const q2 = query(
      collection(db, "bets"),
      where("takerId", "==", user.uid)
    )

    let creatorBets: Bet[] = []
    let takerBets: Bet[] = []
    let q1Loaded = false
    let q2Loaded = false

    const unsub1 = onSnapshot(q1, (snap) => {
      creatorBets = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Bet)
      q1Loaded = true
      if (q1Loaded && q2Loaded) mergeBets()
    })

    const unsub2 = onSnapshot(q2, (snap) => {
      takerBets = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Bet)
      q2Loaded = true
      if (q1Loaded && q2Loaded) mergeBets()
    })

    function mergeBets() {
      const merged = new Map<string, Bet>()
      for (const b of [...creatorBets, ...takerBets]) {
        merged.set(b.id, b)
      }
      setBets(Array.from(merged.values()))
      setLoading(false)
    }

    return () => {
      unsub1()
      unsub2()
    }
  }, [user])

  if (!user) return null

  const ledger = computeLedger(bets, user.uid)
  const settledBets = bets.filter((b) => b.status === "settled")
  const activeBets = bets.filter(
    (b) => b.status === "taken" || b.status === "pending_resolution"
  )

  const totalOwedToYou = ledger
    .filter((e) => e.netBalance > 0)
    .reduce((sum, e) => sum + e.netBalance, 0)
  const totalYouOwe = ledger
    .filter((e) => e.netBalance < 0)
    .reduce((sum, e) => sum + Math.abs(e.netBalance), 0)
  const netPosition = totalOwedToYou - totalYouOwe

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Your betting ledger and stats at a glance.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate("/bets")}
        >
          <Receipt className="h-4 w-4" />
          Browse Bets
        </Button>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            title="Owed to You"
            amount={totalOwedToYou}
            icon={TrendingUp}
            variant="positive"
          />
          <SummaryCard
            title="You Owe"
            amount={totalYouOwe}
            icon={TrendingDown}
            variant="negative"
          />
          <SummaryCard
            title="Net Position"
            amount={netPosition}
            icon={Scale}
            variant={netPosition >= 0 ? "positive" : "negative"}
          />
        </div>
      )}

      {/* Stats row */}
      {!loading && (
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground font-mono">
              {settledBets.length}
            </span>{" "}
            settled
          </span>
          <span>
            <span className="font-semibold text-foreground font-mono">
              {activeBets.length}
            </span>{" "}
            active
          </span>
          <span>
            <span className="font-semibold text-foreground font-mono">
              {bets.filter((b) => b.status === "open").length}
            </span>{" "}
            open
          </span>
        </div>
      )}

      {/* Ledger */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Ledger</h2>
        {loading ? (
          <Skeleton className="h-48 rounded-lg" />
        ) : (
          <LedgerTable entries={ledger} />
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  title,
  amount,
  icon: Icon,
  variant,
}: {
  title: string
  amount: number
  icon: React.ElementType
  variant: "positive" | "negative"
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon
          className={cn(
            "h-4 w-4",
            variant === "positive" ? "text-primary" : "text-destructive"
          )}
        />
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-2xl font-bold font-mono",
            variant === "positive" ? "text-primary" : "text-destructive"
          )}
        >
          {"$" + Math.abs(amount).toFixed(2)}
        </p>
      </CardContent>
    </Card>
  )
}
