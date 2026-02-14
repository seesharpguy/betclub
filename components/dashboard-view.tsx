"use client"

import { useEffect, useState } from "react"
import { collection, query, where, onSnapshot, doc, writeBatch } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "@/lib/router-context"
import type { Bet } from "@/lib/types"
import { LedgerTable, type LedgerEntry } from "@/components/ledger-table"
import { GroupDashboard } from "@/components/group-dashboard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Receipt,
  Target,
  Flame,
  DollarSign,
  Wallet,
  Trophy,
  Skull,
  AlertCircle,
  Clock,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

function computeLedger(bets: Bet[], userId: string): LedgerEntry[] {
  const map = new Map<
    string,
    {
      opponentName: string
      opponentPhoto: string | null
      betsWon: number
      betsLost: number
      netBalance: number
      unpaidLostBetIds: string[]
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
      unpaidLostBetIds: [],
    }

    if (bet.winnerId === userId) {
      existing.betsWon += 1
      if (!bet.paidOut) {
        existing.netBalance += bet.amount
      }
    } else {
      existing.betsLost += 1
      if (!bet.paidOut) {
        existing.netBalance -= bet.amount
        existing.unpaidLostBetIds.push(bet.id)
      }
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
  const [settlingOpponentId, setSettlingOpponentId] = useState<string | null>(null)

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

  // Earnings stats
  const userSettledBets = settledBets.filter(
    (b) => b.creatorId === user.uid || b.takerId === user.uid
  )
  const wonBets = userSettledBets.filter((b) => b.winnerId === user.uid)
  const lostBets = userSettledBets.filter((b) => b.winnerId && b.winnerId !== user.uid)
  const totalWinnings = wonBets.reduce((sum, b) => sum + b.amount, 0)
  const totalLosses = lostBets.reduce((sum, b) => sum + b.amount, 0)
  const overallEarnings = totalWinnings - totalLosses

  // Balance stats (unpaid debts)
  const totalOwedToYou = ledger
    .filter((e) => e.netBalance > 0)
    .reduce((sum, e) => sum + e.netBalance, 0)
  const totalYouOwe = ledger
    .filter((e) => e.netBalance < 0)
    .reduce((sum, e) => sum + Math.abs(e.netBalance), 0)
  const netPosition = totalOwedToYou - totalYouOwe

  // Performance stats
  const winRate = userSettledBets.length > 0
    ? (wonBets.length / userSettledBets.length) * 100
    : 0
  const biggestWin = wonBets.length > 0
    ? Math.max(...wonBets.map((b) => b.amount))
    : 0
  const biggestLoss = lostBets.length > 0
    ? Math.max(...lostBets.map((b) => b.amount))
    : 0

  // Win streak (consecutive wins from most recent)
  const sortedSettled = [...userSettledBets].sort((a, b) => {
    const aTime = a.settledAt?.toDate().getTime() ?? 0
    const bTime = b.settledAt?.toDate().getTime() ?? 0
    return bTime - aTime
  })
  let winStreak = 0
  for (const bet of sortedSettled) {
    if (bet.winnerId === user.uid) {
      winStreak++
    } else {
      break
    }
  }

  // Avg bet & total wagered
  const allParticipatedBets = bets.filter(
    (b) => (b.creatorId === user.uid || b.takerId === user.uid) && b.status !== "open"
  )
  const totalWagered = allParticipatedBets.reduce((sum, b) => sum + b.amount, 0)
  const avgBetSize = allParticipatedBets.length > 0
    ? totalWagered / allParticipatedBets.length
    : 0

  // Pending actions
  const pendingActions = bets.filter(
    (b) =>
      b.status === "pending_resolution" &&
      b.declaredBy !== user.uid &&
      (b.creatorId === user.uid || b.takerId === user.uid)
  )

  // Recent activity
  const recentActivity = [...bets]
    .filter((b) => b.createdAt)
    .sort((a, b) => {
      const aTime = a.settledAt?.toDate().getTime() ?? a.createdAt?.toDate().getTime() ?? 0
      const bTime = b.settledAt?.toDate().getTime() ?? b.createdAt?.toDate().getTime() ?? 0
      return bTime - aTime
    })
    .slice(0, 10)

  const handleSettleUp = async (_opponentId: string, betIds: string[]) => {
    setSettlingOpponentId(_opponentId)
    try {
      const batch = writeBatch(db)
      for (const betId of betIds) {
        batch.update(doc(db, "bets", betId), { paidOut: true })
      }
      await batch.commit()
      toast.success("Debts marked as settled!")
    } catch {
      toast.error("Failed to settle debts.")
    } finally {
      setSettlingOpponentId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
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

      <Tabs defaultValue="my-stats">
        <TabsList>
          <TabsTrigger value="my-stats">My Stats</TabsTrigger>
          <TabsTrigger value="group" className="gap-2">
            <Users className="h-4 w-4" />
            Group
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-stats" className="mt-4">
          {loading ? (
            <div className="flex flex-col gap-4">
              <div className="grid gap-4 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-lg" />
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-lg" />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Row 1: Earnings */}
              <div className="grid gap-4 sm:grid-cols-3">
                <SummaryCard
                  title="Total Winnings"
                  amount={totalWinnings}
                  icon={TrendingUp}
                  variant="positive"
                />
                <SummaryCard
                  title="Total Losses"
                  amount={totalLosses}
                  icon={TrendingDown}
                  variant="negative"
                />
                <SummaryCard
                  title="Overall Earnings"
                  amount={overallEarnings}
                  icon={Scale}
                  variant={overallEarnings >= 0 ? "positive" : "negative"}
                />
              </div>

              {/* Row 2: Balances (unpaid debts) */}
              <div>
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Balances</h2>
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
              </div>

              {/* Row 3: Performance Metrics */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                  label="Win Rate"
                  value={winRate.toFixed(0) + "%"}
                  subtext={wonBets.length + " of " + userSettledBets.length + " bets"}
                  icon={Target}
                />
                <MetricCard
                  label="Win Streak"
                  value={String(winStreak)}
                  subtext={winStreak > 0 ? "consecutive wins" : "no active streak"}
                  icon={Flame}
                />
                <MetricCard
                  label="Avg Bet Size"
                  value={"$" + avgBetSize.toFixed(2)}
                  subtext={allParticipatedBets.length + " total bets"}
                  icon={DollarSign}
                />
                <MetricCard
                  label="Total Wagered"
                  value={"$" + totalWagered.toFixed(2)}
                  subtext="lifetime amount"
                  icon={Wallet}
                />
              </div>

              {/* Row 4: Highlights + Actions */}
              <div className="grid gap-4 sm:grid-cols-3">
                <HighlightCard
                  label="Biggest Win"
                  amount={biggestWin}
                  variant="win"
                  icon={Trophy}
                  empty={wonBets.length === 0}
                />
                <HighlightCard
                  label="Biggest Loss"
                  amount={biggestLoss}
                  variant="loss"
                  icon={Skull}
                  empty={lostBets.length === 0}
                />
                <Card className="animate-fade-in-up opacity-0 transition-all duration-300 hover:shadow-[0_0_20px_hsl(265_90%_65%/0.1)]" style={{ animationDelay: "150ms" }}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pending Actions
                    </CardTitle>
                    <AlertCircle className={cn(
                      "h-4 w-4",
                      pendingActions.length > 0 ? "text-warning" : "text-muted-foreground"
                    )} />
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold font-mono">
                      {pendingActions.length}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {pendingActions.length > 0
                        ? "bets awaiting your confirmation"
                        : "no actions needed"}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Stats row */}
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

              {/* Row 5: Recent Activity + Ledger */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent Activity */}
                <div className="flex flex-col gap-3">
                  <h2 className="text-lg font-semibold">Recent Activity</h2>
                  {recentActivity.length === 0 ? (
                    <Card>
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Clock className="h-10 w-10 text-muted-foreground" />
                        <p className="mt-3 text-sm text-muted-foreground">
                          No activity yet.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="glass border-border/50">
                      <CardContent className="flex flex-col divide-y divide-border/50 p-0">
                        {recentActivity.map((bet, i) => (
                          <ActivityItem
                            key={bet.id}
                            bet={bet}
                            userId={user.uid}
                            onNavigate={() => navigate(`/bets/${bet.id}`)}
                            index={i}
                          />
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Ledger */}
                <div className="flex flex-col gap-3">
                  <h2 className="text-lg font-semibold">Ledger</h2>
                  <LedgerTable
                    entries={ledger}
                    onSettleUp={handleSettleUp}
                    settlingOpponentId={settlingOpponentId}
                  />
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="group" className="mt-4">
          <GroupDashboard />
        </TabsContent>
      </Tabs>
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
    <Card className="animate-fade-in-up opacity-0 transition-all duration-300 hover:shadow-[0_0_20px_hsl(265_90%_65%/0.1)]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon
          className={cn(
            "h-4 w-4",
            variant === "positive" ? "text-success" : "text-destructive"
          )}
        />
      </CardHeader>
      <CardContent>
        <p
          className={cn(
            "text-2xl font-bold font-mono",
            variant === "positive" ? "text-success" : "text-destructive"
          )}
        >
          {"$" + Math.abs(amount).toFixed(2)}
        </p>
      </CardContent>
    </Card>
  )
}

function MetricCard({
  label,
  value,
  subtext,
  icon: Icon,
}: {
  label: string
  value: string
  subtext: string
  icon: React.ElementType
}) {
  return (
    <Card className="animate-fade-in-up opacity-0 transition-all duration-300 hover:shadow-[0_0_20px_hsl(265_90%_65%/0.1)]" style={{ animationDelay: "75ms" }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold font-mono">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
      </CardContent>
    </Card>
  )
}

function HighlightCard({
  label,
  amount,
  variant,
  icon: Icon,
  empty,
}: {
  label: string
  amount: number
  variant: "win" | "loss"
  icon: React.ElementType
  empty: boolean
}) {
  return (
    <Card className="animate-fade-in-up opacity-0 transition-all duration-300 hover:shadow-[0_0_20px_hsl(265_90%_65%/0.1)]" style={{ animationDelay: "150ms" }}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <Icon className={cn(
          "h-4 w-4",
          variant === "win" ? "text-success" : "text-destructive"
        )} />
      </CardHeader>
      <CardContent>
        {empty ? (
          <p className="text-2xl font-bold font-mono text-muted-foreground">--</p>
        ) : (
          <p className={cn(
            "text-2xl font-bold font-mono",
            variant === "win" ? "text-success" : "text-destructive"
          )}>
            {"$" + amount.toFixed(2)}
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function ActivityItem({
  bet,
  userId,
  onNavigate,
  index,
}: {
  bet: Bet
  userId: string
  onNavigate: () => void
  index: number
}) {
  const isCreator = bet.creatorId === userId

  let actionText: string
  let actionColor: string
  if (bet.status === "settled" && bet.winnerId === userId) {
    actionText = "Won"
    actionColor = "text-success"
  } else if (bet.status === "settled" && bet.winnerId && bet.winnerId !== userId) {
    actionText = "Lost"
    actionColor = "text-destructive"
  } else if (bet.status === "open" && isCreator) {
    actionText = "Created"
    actionColor = "text-neon-cyan"
  } else if (bet.status === "taken" || bet.status === "pending_resolution") {
    actionText = isCreator ? "Created" : "Taken"
    actionColor = "text-primary"
  } else {
    actionText = isCreator ? "Created" : "Taken"
    actionColor = "text-muted-foreground"
  }

  const date = bet.settledAt?.toDate() ?? bet.createdAt?.toDate()

  return (
    <button
      onClick={onNavigate}
      className="flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors animate-fade-in-up opacity-0"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm truncate">{bet.description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {"$" + bet.amount.toFixed(2)}
          {bet.takerName && !isCreator
            ? " with " + bet.creatorName
            : bet.takerName
              ? " with " + bet.takerName
              : ""}
        </p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className={cn("text-xs font-semibold", actionColor)}>
          {actionText}
        </span>
        {date && (
          <span className="text-xs text-muted-foreground">
            {date.toLocaleDateString()}
          </span>
        )}
      </div>
    </button>
  )
}
