"use client"

import { useAuth } from "@/lib/auth-context"
import { useRouter } from "@/lib/router-context"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LayoutDashboard, Receipt, LogOut, ChevronDown, Sun, Moon, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { InviteDialog } from "@/components/invite-dialog"

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/bets", label: "Bets", icon: Receipt },
]

export function NavBar() {
  const { user, signOut, isAdmin } = useAuth()
  const [inviteOpen, setInviteOpen] = useState(false)
  const { route, navigate } = useRouter()
  const { theme, setTheme } = useTheme()

  if (!user) return null

  const initials = user.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?"

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <>
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-primary glow-sm">
              <span className="text-sm font-bold text-white font-mono">
                B
              </span>
            </div>
            <span className="text-lg font-bold tracking-tight text-gradient">BetClub</span>
          </button>
          <nav className="hidden items-center gap-1 sm:flex">
            {navLinks.map((link) => {
              const Icon = link.icon
              const isActive =
                route === link.href || route.startsWith(link.href + "/") ||
                (link.href === "/bets" && route === "/bets/:id")
              return (
                <Button
                  key={link.href}
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn(
                    "gap-2",
                    isActive && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => navigate(link.href)}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Button>
              )
            })}
          </nav>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2">
              <Avatar className="h-7 w-7">
                <AvatarImage
                  src={user.photoURL ?? undefined}
                  alt={user.displayName ?? "User"}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <span className="hidden text-sm font-medium sm:inline-block">
                {user.displayName}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">{user.displayName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <div className="sm:hidden">
              {navLinks.map((link) => {
                const Icon = link.icon
                return (
                  <DropdownMenuItem
                    key={link.href}
                    onClick={() => navigate(link.href)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </DropdownMenuItem>
                )
              })}
              <DropdownMenuSeparator />
            </div>
            <DropdownMenuItem onClick={toggleTheme} className="gap-2">
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
              {theme === "dark" ? "Light Mode" : "Dark Mode"}
            </DropdownMenuItem>
            {isAdmin && (
              <DropdownMenuItem onClick={() => setInviteOpen(true)} className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite User
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="gap-2 text-destructive">
              <LogOut className="h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
    {isAdmin && <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} />}
    </>
  )
}
