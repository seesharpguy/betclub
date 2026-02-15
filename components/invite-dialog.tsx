"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-context"
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"

interface InviteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InviteDialog({ open, onOpenChange }: InviteDialogProps) {
  const { user } = useAuth()
  const [email, setEmail] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const normalizedEmail = email.trim().toLowerCase()
    if (!normalizedEmail) {
      toast.error("Please enter an email address.")
      return
    }

    setSubmitting(true)
    try {
      // Check if already invited
      const inviteRef = doc(db, "invitations", normalizedEmail)
      const inviteSnap = await getDoc(inviteRef)

      if (inviteSnap.exists()) {
        toast.error("This email has already been invited.")
        setSubmitting(false)
        return
      }

      // Create invitation doc
      await setDoc(inviteRef, {
        email: normalizedEmail,
        invitedBy: user.uid,
        invitedByName: user.displayName ?? "Anonymous",
        createdAt: serverTimestamp(),
        status: "pending",
      })

      // Create email doc for Firebase Trigger Email extension
      await addDoc(collection(db, "mail"), {
        to: [normalizedEmail],
        message: {
          subject: "You've been invited to BetClub",
          text: `You've been invited to BetClub by ${user.displayName ?? "a member"}. Sign in with your Google account at https://betclub.dev to get started.`,
          html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; border-radius: 16px; background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; font-size: 24px; font-weight: bold; font-family: monospace;">B</div>
                <h1 style="margin: 16px 0 0; font-size: 24px; font-weight: bold;">BetClub</h1>
              </div>
              <p style="font-size: 16px; color: #374151;">You've been invited to BetClub by <strong>${user.displayName ?? "a member"}</strong>.</p>
              <p style="font-size: 14px; color: #6b7280;">Sign in with your Google account at <a href="https://betclub.dev" style="color: #7c3aed;">betclub.dev</a> to get started.</p>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
              <p style="font-size: 12px; color: #9ca3af; text-align: center;">You received this because someone invited you to BetClub.</p>
            </div>
          `,
        },
      })

      toast.success(`Invitation sent to ${normalizedEmail}`)
      setEmail("")
      onOpenChange(false)
    } catch {
      toast.error("Failed to send invitation. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md glass border-border/30">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Invite User</DialogTitle>
            <DialogDescription>
              Send an invitation to join BetClub. They{"'"}ll receive an email with instructions to sign in.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-email">Email address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="friend@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Sending..." : "Send Invite"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
