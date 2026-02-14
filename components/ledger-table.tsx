"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus, CheckCheck } from "lucide-react"

export interface LedgerEntry {
  opponentId: string
  opponentName: string
  opponentPhoto: string | null
  betsWon: number
  betsLost: number
  netBalance: number
  unpaidLostBetIds: string[]
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export function LedgerTable({
  entries,
  onSettleUp,
  settlingOpponentId,
}: {
  entries: LedgerEntry[]
  onSettleUp?: (opponentId: string, betIds: string[]) => void
  settlingOpponentId?: string | null
}) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <Minus className="h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          No settled bets yet. Your ledger will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg glass border-border/50">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Opponent</TableHead>
            <TableHead className="text-center">Won</TableHead>
            <TableHead className="text-center">Lost</TableHead>
            <TableHead className="text-right">Net Balance</TableHead>
            {onSettleUp && <TableHead className="text-right w-[100px]" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.opponentId}>
              <TableCell>
                <div className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={entry.opponentPhoto ?? undefined} />
                    <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                      {getInitials(entry.opponentName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-sm">
                    {entry.opponentName}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-center font-mono text-sm">
                {entry.betsWon}
              </TableCell>
              <TableCell className="text-center font-mono text-sm">
                {entry.betsLost}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 font-mono text-sm font-bold",
                    entry.netBalance > 0 && "text-success",
                    entry.netBalance < 0 && "text-destructive",
                    entry.netBalance === 0 && "text-muted-foreground"
                  )}
                >
                  {entry.netBalance > 0 ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : entry.netBalance < 0 ? (
                    <TrendingDown className="h-3.5 w-3.5" />
                  ) : null}
                  {entry.netBalance >= 0 ? "+" : ""}
                  {"$" + Math.abs(entry.netBalance).toFixed(2)}
                </span>
              </TableCell>
              {onSettleUp && (
                <TableCell className="text-right">
                  {entry.unpaidLostBetIds.length > 0 && entry.netBalance < 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5 text-xs"
                      disabled={settlingOpponentId === entry.opponentId}
                      onClick={() => onSettleUp(entry.opponentId, entry.unpaidLostBetIds)}
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      {settlingOpponentId === entry.opponentId
                        ? "Settling..."
                        : "Settle Up"}
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
