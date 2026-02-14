"use client"

import { useEffect, useState } from "react"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useRouter } from "@/lib/router-context"
import type { Bet } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Receipt,
  DollarSign,
  Zap,
  Users,
  Swords,
  Clock,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface UserStats {
  uid: string
  name: string
  photo: string | null
  totalBets: number
  wins: number
  losses: number
  winRate: number
  totalWagered: number
  netEarnings: number
}

interface Rivalry {
  userA: { uid: string; name: string; photo: string | null }
  userB: { uid: string; name: string; photo: string | null }
  totalBets: number
  aWins: number
  bWins: number
}

function computeLeaderboard(bets: Bet[]): UserStats[] {
  const map = new Map<string, UserStats>()

  function getOrCreate(uid: string, name: string, photo: string | null): UserStats {
    const existing = map.get(uid)
    if (existing) {
      if (name && name !== "Unknown") existing.name = name
      if (photo) existing.photo = photo
      return existing
    }
    const stats: UserStats = {
      uid,
      name: name || "Unknown",
      photo,
      totalBets: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      totalWagered: 0,
      netEarnings: 0,
    }
    map.set(uid, stats)
    return stats
  }

  for (const bet of bets) {
    // Count participation for taken/settled bets
    if (bet.status === "open") continue

    const creator = getOrCreate(bet.creatorId, bet.creatorName, bet.creatorPhoto)
    creator.totalBets += 1
    creator.totalWagered += bet.amount

    if (bet.takerId && bet.takerName) {
      const taker = getOrCreate(bet.takerId, bet.takerName, bet.takerPhoto)
      taker.totalBets += 1
      taker.totalWagered += bet.amount
    }

    // Count wins/losses for settled bets
    if (bet.status === "settled" && bet.winnerId) {
      const winnerId = bet.winnerId
      const loserId = winnerId === bet.creatorId ? bet.takerId : bet.creatorId

      const winner = map.get(winnerId)
      if (winner) {
        winner.wins += 1
        winner.netEarnings += bet.amount
      }

      if (loserId) {
        const loser = map.get(loserId)
        if (loser) {
          loser.losses += 1
          loser.netEarnings -= bet.amount
        }
      }
    }
  }

  for (const stats of map.values()) {
    const settled = stats.wins + stats.losses
    stats.winRate = settled > 0 ? (stats.wins / settled) * 100 : 0
  }

  return Array.from(map.values()).sort((a, b) => b.netEarnings - a.netEarnings)
}

function computeRivalries(bets: Bet[]): Rivalry[] {
  const pairMap = new Map<string, Rivalry>()

  for (const bet of bets) {
    if (!bet.takerId || bet.status === "open") continue

    const [idA, idB] = [bet.creatorId, bet.takerId].sort()
    const key = `${idA}::${idB}`

    if (!pairMap.has(key)) {
      const isACreator = idA === bet.creatorId
      pairMap.set(key, {
        userA: {
          uid: idA,
          name: isACreator ? bet.creatorName : (bet.takerName ?? "Unknown"),
          photo: isACreator ? bet.creatorPhoto : bet.takerPhoto,
        },
        userB: {
          uid: idB,
          name: isACreator ? (bet.takerName ?? "Unknown") : bet.creatorName,
          photo: isACreator ? bet.takerPhoto : bet.creatorPhoto,
        },
        totalBets: 0,
        aWins: 0,
        bWins: 0,
      })
    }

    const rivalry = pairMap.get(key)!
    rivalry.totalBets += 1

    // Update names/photos with latest
    const isACreator = idA === bet.creatorId
    if (isACreator) {
      if (bet.creatorName) rivalry.userA.name = bet.creatorName
      if (bet.creatorPhoto) rivalry.userA.photo = bet.creatorPhoto
      if (bet.takerName) rivalry.userB.name = bet.takerName
      if (bet.takerPhoto) rivalry.userB.photo = bet.takerPhoto
    } else {
      if (bet.takerName) rivalry.userA.name = bet.takerName
      if (bet.takerPhoto) rivalry.userA.photo = bet.takerPhoto
      if (bet.creatorName) rivalry.userB.name = bet.creatorName
      if (bet.creatorPhoto) rivalry.userB.photo = bet.creatorPhoto
    }

    if (bet.status === "settled" && bet.winnerId) {
      if (bet.winnerId === idA) rivalry.aWins += 1
      else if (bet.winnerId === idB) rivalry.bWins += 1
    }
  }

  return Array.from(pairMap.values()).sort((a, b) => b.totalBets - a.totalBets).slice(0, 5)
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function GroupDashboard() {
  const { navigate } = useRouter()
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

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  const totalBetsCount = bets.length
  const takenOrSettledBets = bets.filter(
    (b) => b.status === "taken" || b.status === "pending_resolution" || b.status === "settled"
  )
  const totalWagered = takenOrSettledBets.reduce((sum, b) => sum + b.amount, 0)
  const activeBetsCount = bets.filter(
    (b) => b.status === "taken" || b.status === "pending_resolution"
  ).length

  const memberIds = new Set<string>()
  for (const b of bets) {
    memberIds.add(b.creatorId)
    if (b.takerId) memberIds.add(b.takerId)
  }
  const membersCount = memberIds.size

  const leaderboard = computeLeaderboard(bets)
  const rivalries = computeRivalries(bets)

  const latestBets = bets.slice(0, 10)

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GroupStatCard
          title="Total Bets"
          value={String(totalBetsCount)}
          icon={Receipt}
        />
        <GroupStatCard
          title="Total Wagered"
          value={"$" + totalWagered.toFixed(2)}
          icon={DollarSign}
        />
        <GroupStatCard
          title="Active Bets"
          value={String(activeBetsCount)}
          icon={Zap}
        />
        <GroupStatCard
          title="Members"
          value={String(membersCount)}
          icon={Users}
        />
      </div>

      {/* Leaderboard */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Top Bettors</h2>
        {leaderboard.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                No bets yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass border-border/50">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Bettor</TableHead>
                  <TableHead className="text-center">Bets</TableHead>
                  <TableHead className="text-center">W-L</TableHead>
                  <TableHead className="text-center">Win %</TableHead>
                  <TableHead className="text-right">Wagered</TableHead>
                  <TableHead className="text-right">Net Earnings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((user, i) => (
                  <TableRow
                    key={user.uid}
                    className="animate-fade-in-up opacity-0"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <TableCell className="font-mono text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarImage
                            src={user.photo ?? undefined}
                            alt={user.name}
                          />
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {user.totalBets}
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      <span className="text-success">{user.wins}</span>
                      {"-"}
                      <span className="text-destructive">{user.losses}</span>
                    </TableCell>
                    <TableCell className="text-center font-mono">
                      {user.winRate.toFixed(0)}%
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${user.totalWagered.toFixed(2)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right font-mono font-semibold",
                        user.netEarnings > 0
                          ? "text-success"
                          : user.netEarnings < 0
                            ? "text-destructive"
                            : "text-muted-foreground"
                      )}
                    >
                      {user.netEarnings >= 0 ? "+" : ""}${user.netEarnings.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Rivalries */}
      {rivalries.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold">Rivalries</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rivalries.map((rivalry, i) => (
              <Card
                key={`${rivalry.userA.uid}-${rivalry.userB.uid}`}
                className="animate-fade-in-up opacity-0 transition-all duration-300 hover:shadow-[0_0_20px_hsl(265_90%_65%/0.1)]"
                style={{ animationDelay: `${i * 75}ms` }}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {rivalry.totalBets} bets
                  </CardTitle>
                  <Swords className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage
                          src={rivalry.userA.photo ?? undefined}
                          alt={rivalry.userA.name}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(rivalry.userA.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">
                        {rivalry.userA.name.split(" ")[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span
                        className={cn(
                          "font-mono text-sm font-bold",
                          rivalry.aWins > rivalry.bWins
                            ? "text-success"
                            : rivalry.aWins < rivalry.bWins
                              ? "text-destructive"
                              : "text-muted-foreground"
                        )}
                      >
                        {rivalry.aWins}
                      </span>
                      <span className="text-xs text-muted-foreground">-</span>
                      <span
                        className={cn(
                          "font-mono text-sm font-bold",
                          rivalry.bWins > rivalry.aWins
                            ? "text-success"
                            : rivalry.bWins < rivalry.aWins
                              ? "text-destructive"
                              : "text-muted-foreground"
                        )}
                      >
                        {rivalry.bWins}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 min-w-0 flex-row-reverse">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarImage
                          src={rivalry.userB.photo ?? undefined}
                          alt={rivalry.userB.name}
                        />
                        <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                          {getInitials(rivalry.userB.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium truncate">
                        {rivalry.userB.name.split(" ")[0]}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Latest Bets */}
      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Latest Bets</h2>
        {latestBets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-10 w-10 text-muted-foreground" />
              <p className="mt-3 text-sm text-muted-foreground">
                No bets yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass border-border/50">
            <CardContent className="flex flex-col divide-y divide-border/50 p-0">
              {latestBets.map((bet, i) => (
                <GroupActivityItem
                  key={bet.id}
                  bet={bet}
                  onNavigate={() => navigate(`/bets/${bet.id}`)}
                  index={i}
                />
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function GroupStatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string
  value: string
  icon: React.ElementType
}) {
  return (
    <Card className="animate-fade-in-up opacity-0 transition-all duration-300 hover:shadow-[0_0_20px_hsl(265_90%_65%/0.1)]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-primary" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold font-mono">{value}</p>
      </CardContent>
    </Card>
  )
}

function GroupActivityItem({
  bet,
  onNavigate,
  index,
}: {
  bet: Bet
  onNavigate: () => void
  index: number
}) {
  let statusText: string
  let statusColor: string

  if (bet.status === "settled" && bet.winnerId) {
    const winnerName =
      bet.winnerId === bet.creatorId ? bet.creatorName : (bet.takerName ?? "Unknown")
    statusText = winnerName.split(" ")[0] + " won"
    statusColor = "text-success"
  } else if (bet.status === "open") {
    statusText = "Open"
    statusColor = "text-neon-cyan"
  } else if (bet.status === "pending_resolution") {
    statusText = "Pending"
    statusColor = "text-warning"
  } else {
    statusText = "Active"
    statusColor = "text-primary"
  }

  const participants =
    bet.takerName
      ? bet.creatorName.split(" ")[0] + " vs " + bet.takerName.split(" ")[0]
      : bet.creatorName.split(" ")[0]

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
          {"$" + bet.amount.toFixed(2)} &middot; {participants}
        </p>
      </div>
      <div className="flex flex-col items-end shrink-0">
        <span className={cn("text-xs font-semibold", statusColor)}>
          {statusText}
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
