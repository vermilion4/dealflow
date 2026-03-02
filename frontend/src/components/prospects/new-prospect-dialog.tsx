"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/toast"
import { createProspect } from "@/lib/api"

interface NewProspectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => void
}

export function NewProspectDialog({ open, onOpenChange, onCreated }: NewProspectDialogProps) {
  const [companyName, setCompanyName] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!companyName.trim()) return
    setLoading(true)
    try {
      await createProspect(companyName.trim())
      setCompanyName("")
      onOpenChange(false)
      onCreated()
    } catch {
      toast({
        title: "Failed to start research",
        description: "Something went wrong. Please try again.",
        variant: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Research</DialogTitle>
          <DialogDescription>
            Enter a company name to start the AI research pipeline.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input
            placeholder="e.g., Stripe, Notion, Datadog..."
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !companyName.trim()}>
              {loading ? "Starting..." : "Start Research"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
