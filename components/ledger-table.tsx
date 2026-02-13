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
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

export interface LedgerEntry {
  opponentId: string
  opponentName: string
  opponentPhoto: string | null
  betsWon: number
  betsLost: number
  netBalance: number
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

export function LedgerTable({ entries }: { entries: LedgerEntry[] }) {
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
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Opponent</TableHead>
            <TableHead className="text-center">Won</TableHead>
            <TableHead className="text-center">Lost</TableHead>
            <TableHead className="text-right">Net Balance</TableHead>
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
                    entry.netBalance > 0 && "text-primary",
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
