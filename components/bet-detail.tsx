"use client"

import { useEffect, useState } from "react"
import { doc, onSnapshot, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "@/lib/router-context"
import type { Bet } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  Clock,
  Handshake,
  AlertCircle,
  CheckCircle2,
  Trophy,
  ArrowLeft,
  DollarSign,
  Trash2,
} from "lucide-react"

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

const statusConfig: Record<
  Bet["status"],
  { label: string; className: string; icon: React.ElementType; description: string }
> = {
  open: {
    label: "Open",
    className: "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20",
    icon: Clock,
    description: "Waiting for someone to take this bet.",
  },
  taken: {
    label: "Taken",
    className: "bg-primary/10 text-primary border-primary/20",
    icon: Handshake,
    description: "Bet accepted! Waiting for outcome.",
  },
  pending_resolution: {
    label: "Pending Confirmation",
    className: "bg-warning/10 text-warning-foreground border-warning/20",
    icon: AlertCircle,
    description: "A winner has been declared. Waiting for the other party to confirm.",
  },
  settled: {
    label: "Settled",
    className: "bg-muted text-muted-foreground border-muted",
    icon: CheckCircle2,
    description: "This bet has been settled.",
  },
}

export function BetDetailView({ betId }: { betId: string }) {
  const { user, isAdmin } = useAuth()
  const { navigate } = useRouter()
  const [bet, setBet] = useState<Bet | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)

  useEffect(() => {
    if (!betId) return
    const unsubscribe = onSnapshot(doc(db, "bets", betId), (snap) => {
      if (snap.exists()) {
        setBet({ id: snap.id, ...snap.data() } as Bet)
      } else {
        setBet(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [betId])

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    )
  }

  if (!bet) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <p className="text-muted-foreground">Bet not found.</p>
        <button
          onClick={() => navigate("/bets")}
          className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Bets
        </button>
      </div>
    )
  }

  const config = statusConfig[bet.status]
  const StatusIcon = config.icon
  const isCreator = user?.uid === bet.creatorId
  const isTaker = user?.uid === bet.takerId
  const isParticipant = isCreator || isTaker

  const handleTakeBet = async () => {
    if (!user) return
    setActing(true)
    try {
      await updateDoc(doc(db, "bets", bet.id), {
        takerId: user.uid,
        takerName: user.displayName ?? "Anonymous",
        takerPhoto: user.photoURL ?? null,
        status: "taken",
      })
      toast.success("You took the bet!")
    } catch {
      toast.error("Failed to take bet.")
    } finally {
      setActing(false)
    }
  }

  const handleDeclareWinner = async (winnerId: string) => {
    if (!user) return
    setActing(true)
    try {
      await updateDoc(doc(db, "bets", bet.id), {
        winnerId,
        declaredBy: user.uid,
        status: "pending_resolution",
      })
      toast.success("Winner declared! Waiting for confirmation.")
    } catch {
      toast.error("Failed to declare winner.")
    } finally {
      setActing(false)
    }
  }

  const handleConfirm = async () => {
    if (!user) return
    setActing(true)
    try {
      await updateDoc(doc(db, "bets", bet.id), {
        confirmedBy: user.uid,
        status: "settled",
        settledAt: serverTimestamp(),
      })
      toast.success("Bet settled!")
    } catch {
      toast.error("Failed to confirm.")
    } finally {
      setActing(false)
    }
  }

  const handleDispute = async () => {
    if (!user) return
    setActing(true)
    try {
      await updateDoc(doc(db, "bets", bet.id), {
        winnerId: null,
        declaredBy: null,
        status: "taken",
      })
      toast.info("Declaration disputed. The bet is back to active.")
    } catch {
      toast.error("Failed to dispute.")
    } finally {
      setActing(false)
    }
  }

  const handleCancelBet = async () => {
    setActing(true)
    try {
      await deleteDoc(doc(db, "bets", bet.id))
      toast.success("Bet cancelled and deleted.")
      navigate("/bets")
    } catch {
      toast.error("Failed to cancel bet.")
    } finally {
      setActing(false)
    }
  }

  const winnerName =
    bet.winnerId === bet.creatorId
      ? bet.creatorName
      : bet.winnerId === bet.takerId
        ? bet.takerName
        : null

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => navigate("/bets")}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors self-start"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Bets
      </button>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 overflow-hidden">
          <div className="flex flex-col gap-1 min-w-0">
            <CardTitle className="text-xl leading-relaxed text-balance break-words">
              {bet.description}
            </CardTitle>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Badge
                variant="outline"
                className={cn("gap-1", config.className)}
              >
                <StatusIcon className="h-3 w-3" />
                {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {config.description}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 shrink-0 glow-sm">
            <DollarSign className="h-5 w-5 text-primary" />
            <span className="text-2xl font-bold font-mono text-primary">
              {bet.amount.toFixed(2)}
            </span>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-6">
          {/* Participants */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Participants
            </h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
              <ParticipantRow
                label="Creator"
                name={bet.creatorName}
                photo={bet.creatorPhoto}
                isWinner={bet.status === "settled" && bet.winnerId === bet.creatorId}
              />
              {bet.takerName ? (
                <ParticipantRow
                  label="Taker"
                  name={bet.takerName}
                  photo={bet.takerPhoto}
                  isWinner={bet.status === "settled" && bet.winnerId === bet.takerId}
                />
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30">
                    <span className="text-xs text-muted-foreground">?</span>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Taker</p>
                    <p className="text-sm text-muted-foreground italic">
                      Waiting...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Settled Result */}
          {bet.status === "settled" && winnerName && (
            <>
              <Separator />
              <div className="flex items-center gap-3 rounded-lg gradient-primary-subtle border border-primary/20 p-4">
                <Trophy className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-semibold">
                    {winnerName} won!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {bet.settledAt
                      ? "Settled on " + bet.settledAt.toDate().toLocaleDateString()
                      : "Settled"}
                  </p>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <Separator />
          <div className="flex flex-col gap-3">
            {/* Open: non-creator can take */}
            {bet.status === "open" && !isCreator && (
              <Button
                onClick={handleTakeBet}
                disabled={acting}
                size="lg"
                className="gap-2"
              >
                <Handshake className="h-4 w-4" />
                {acting ? "Taking..." : "Take this Bet"}
              </Button>
            )}

            {/* Open: creator sees waiting message + cancel button */}
            {bet.status === "open" && isCreator && (
              <div className="flex flex-col items-center gap-3 py-2">
                <p className="text-sm text-muted-foreground text-center">
                  Waiting for someone to take your bet...
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="gap-2"
                      disabled={acting}
                    >
                      <Trash2 className="h-4 w-4" />
                      Cancel Bet
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel this bet?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete the bet. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Keep Bet</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleCancelBet}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete Bet
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}

            {/* Open: admin (non-creator) can delete */}
            {bet.status === "open" && !isCreator && isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-2"
                    disabled={acting}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete Bet
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this bet?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete {bet.creatorName}&apos;s bet. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Bet</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelBet}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Bet
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}

            {/* Taken: participants can declare winner */}
            {bet.status === "taken" && isParticipant && (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium">Who won?</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="outline"
                    className="flex-1 gap-2"
                    onClick={() => handleDeclareWinner(bet.creatorId)}
                    disabled={acting}
                  >
                    <Trophy className="h-4 w-4" />
                    {bet.creatorName} won
                  </Button>
                  {bet.takerId && (
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => handleDeclareWinner(bet.takerId!)}
                      disabled={acting}
                    >
                      <Trophy className="h-4 w-4" />
                      {bet.takerName} won
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Pending resolution: the OTHER party confirms or disputes */}
            {bet.status === "pending_resolution" && isParticipant && (
              <>
                {bet.declaredBy === user?.uid ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    {"You declared "}
                    <span className="font-semibold text-foreground">{winnerName}</span>
                    {" as the winner. Waiting for confirmation..."}
                  </p>
                ) : (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm">
                      <span className="font-semibold">
                        {bet.declaredBy === bet.creatorId
                          ? bet.creatorName
                          : bet.takerName}
                      </span>
                      {" declared "}
                      <span className="font-semibold text-primary">{winnerName}</span>
                      {" as the winner."}
                    </p>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        onClick={handleConfirm}
                        disabled={acting}
                        className="flex-1 gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {acting ? "Confirming..." : "Confirm"}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDispute}
                        disabled={acting}
                        className="flex-1 gap-2"
                      >
                        <AlertCircle className="h-4 w-4" />
                        Dispute
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Not participant and not open */}
            {!isParticipant && bet.status !== "open" && bet.status !== "settled" && (
              <p className="text-sm text-muted-foreground text-center py-2">
                You are not a participant in this bet.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ParticipantRow({
  label,
  name,
  photo,
  isWinner,
}: {
  label: string
  name: string
  photo: string | null
  isWinner: boolean
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={photo ?? undefined} />
          <AvatarFallback className="bg-secondary text-secondary-foreground text-sm">
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        {isWinner && (
          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
            <Trophy className="h-3 w-3 text-primary-foreground" />
          </div>
        )}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn("text-sm font-medium", isWinner && "text-primary")}>
          {name}
        </p>
      </div>
    </div>
  )
}
