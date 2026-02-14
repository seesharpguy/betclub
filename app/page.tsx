"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "@/lib/router-context"
import { SignIn } from "@/components/sign-in"
import { NotInvited } from "@/components/not-invited"
import { NavBar } from "@/components/nav-bar"
import { DashboardView } from "@/components/dashboard-view"
import { BetsFeed } from "@/components/bets-feed"
import { BetDetailView } from "@/components/bet-detail"
import { Skeleton } from "@/components/ui/skeleton"

export default function HomePage() {
  const { user, loading, rejected, clearRejection } = useAuth()
  const { route, params } = useRouter()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-2xl" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    )
  }

  if (rejected) {
    return <NotInvited onTryAnother={clearRejection} />
  }

  if (!user) {
    return <SignIn />
  }

  function renderView() {
    switch (route) {
      case "/bets":
        return <BetsFeed />
      case "/bets/:id":
        return <BetDetailView betId={params.id} />
      case "/dashboard":
      default:
        return <DashboardView />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 py-6">{renderView()}</main>
    </div>
  )
}
