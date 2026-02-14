"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface NotInvitedProps {
  onTryAnother: () => void
}

export function NotInvited({ onTryAnother }: NotInvitedProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 gradient-primary-subtle">
      <Card className="w-full max-w-sm glass border-border/30">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary glow-purple">
            <span className="text-2xl font-bold text-white font-mono">B</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-gradient">BetClub</CardTitle>
          <CardDescription className="text-balance">
            Sorry, you haven{"'"}t been invited.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-sm text-muted-foreground text-center">
            First rule of BetClub is don{"'"}t talk about BetClub.
          </p>
          <Button
            onClick={onTryAnother}
            variant="outline"
            className="w-full"
            size="lg"
          >
            Try Another Account
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
