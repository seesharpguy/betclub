"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useRouter } from "@/lib/router-context"
import { cn } from "@/lib/utils"
import type { Bet } from "@/lib/types"
import { Clock, Handshake, AlertCircle, CheckCircle2 } from "lucide-react"

const statusConfig: Record<
  Bet["status"],
  { label: string; className: string; icon: React.ElementType }
> = {
  open: {
    label: "Open",
    className: "bg-primary/10 text-primary border-primary/20",
    icon: Clock,
  },
  taken: {
    label: "Taken",
    className: "bg-warning/10 text-warning-foreground border-warning/20",
    icon: Handshake,
  },
  pending_resolution: {
    label: "Pending",
    className: "bg-warning/10 text-warning-foreground border-warning/20",
    icon: AlertCircle,
  },
  settled: {
    label: "Settled",
    className: "bg-muted text-muted-foreground border-muted",
    icon: CheckCircle2,
  },
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export function BetCard({ bet }: { bet: Bet }) {
  const { navigate } = useRouter()
  const config = statusConfig[bet.status]
  const StatusIcon = config.icon

  return (
    <button
      onClick={() => navigate(`/bets/${bet.id}`)}
      className="text-left w-full"
    >
      <Card className="group cursor-pointer transition-all hover:border-primary/30 hover:shadow-md">
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={bet.creatorPhoto ?? undefined} />
                <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                  {getInitials(bet.creatorName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {bet.creatorName}
                </p>
                {bet.takerName && (
                  <p className="text-xs text-muted-foreground truncate">
                    {"vs " + bet.takerName}
                  </p>
                )}
              </div>
            </div>
            <Badge
              variant="outline"
              className={cn("shrink-0 gap-1", config.className)}
            >
              <StatusIcon className="h-3 w-3" />
              {config.label}
            </Badge>
          </div>

          <p className="text-sm leading-relaxed line-clamp-2">
            {bet.description}
          </p>

          <div className="flex items-center justify-between">
            <span className="text-lg font-bold font-mono text-primary">
              {"$" + bet.amount.toFixed(2)}
            </span>
            {bet.createdAt && (
              <span className="text-xs text-muted-foreground">
                {bet.createdAt.toDate().toLocaleDateString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </button>
  )
}
