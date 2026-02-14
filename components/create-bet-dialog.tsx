"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/lib/auth-context"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { toast } from "sonner"
import { Plus } from "lucide-react"

export function CreateBetDialog() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [description, setDescription] = useState("")
  const [amount, setAmount] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const parsedAmount = parseFloat(amount)
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error("Please enter a valid description and amount.")
      return
    }

    setSubmitting(true)
    try {
      await addDoc(collection(db, "bets"), {
        creatorId: user.uid,
        creatorName: user.displayName ?? "Anonymous",
        creatorPhoto: user.photoURL ?? null,
        takerId: null,
        takerName: null,
        takerPhoto: null,
        description: description.trim(),
        amount: parsedAmount,
        status: "open",
        winnerId: null,
        declaredBy: null,
        confirmedBy: null,
        createdAt: serverTimestamp(),
        settledAt: null,
      })
      toast.success("Bet created!")
      setDescription("")
      setAmount("")
      setOpen(false)
    } catch {
      toast.error("Failed to create bet. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 gradient-primary border-0">
          <Plus className="h-4 w-4" />
          New Bet
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md glass border-border/30">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create a Bet</DialogTitle>
            <DialogDescription>
              Post a bet for anyone to take. Describe what the bet is about and
              set the dollar amount.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">What{"'"}s the bet?</Label>
              <Textarea
                id="description"
                placeholder="e.g. Warriors win tonight against the Lakers"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="10.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Bet"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
