"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

interface ApprovalActionsProps {
  onApprove: () => Promise<void>
  onReject: () => Promise<void>
  disabled?: boolean
}

export function ApprovalActions({ onApprove, onReject, disabled }: ApprovalActionsProps) {
  const [confirming, setConfirming] = useState<"approve" | "reject" | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleAction(action: "approve" | "reject") {
    if (confirming !== action) {
      setConfirming(action)
      return
    }
    setLoading(true)
    try {
      if (action === "approve") await onApprove()
      else await onReject()
    } finally {
      setLoading(false)
      setConfirming(null)
    }
  }

  return (
    <div className="flex gap-2">
      <Button
        onClick={() => handleAction("approve")}
        disabled={disabled || loading}
        className={confirming === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
      >
        {loading && confirming === "approve"
          ? "Sending..."
          : confirming === "approve"
          ? "Confirm Approve"
          : "Approve & Send"}
      </Button>
      <Button
        variant="destructive"
        onClick={() => handleAction("reject")}
        disabled={disabled || loading}
      >
        {loading && confirming === "reject"
          ? "Rejecting..."
          : confirming === "reject"
          ? "Confirm Reject"
          : "Reject"}
      </Button>
      {confirming && (
        <Button variant="ghost" onClick={() => setConfirming(null)} disabled={loading}>
          Cancel
        </Button>
      )}
    </div>
  )
}
