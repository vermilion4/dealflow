"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { useToast } from "@/components/ui/toast"

interface ApprovalActionsProps {
  onApprove: () => Promise<void>
  onReject: () => Promise<void>
  disabled?: boolean
  companyName?: string
  requiresEmail?: boolean
}

export function ApprovalActions({ onApprove, onReject, disabled, companyName, requiresEmail }: ApprovalActionsProps) {
  const [confirmAction, setConfirmAction] = useState<"approve" | "reject" | null>(null)
  const { toast } = useToast()

  function handleApproveClick() {
    if (requiresEmail) {
      toast({
        title: "Recipient email required",
        description: "Enter a recipient email address before approving.",
        variant: "error",
      })
      return
    }
    setConfirmAction("approve")
  }

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={handleApproveClick}
          disabled={disabled}
          className="bg-green-600 hover:bg-green-700"
        >
          Approve & Send
        </Button>
        <Button
          variant="destructive"
          onClick={() => setConfirmAction("reject")}
          disabled={disabled}
        >
          Reject
        </Button>
      </div>

      <ConfirmDialog
        open={confirmAction === "approve"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Approve Outreach"
        description={`This will send the outreach email${companyName ? ` for ${companyName}` : ""}. Are you sure you want to approve and send?`}
        confirmLabel="Approve & Send"
        variant="default"
        onConfirm={onApprove}
      />

      <ConfirmDialog
        open={confirmAction === "reject"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Reject Draft"
        description={`This will reject the outreach draft${companyName ? ` for ${companyName}` : ""}. This action cannot be undone.`}
        confirmLabel="Reject"
        variant="destructive"
        onConfirm={onReject}
      />
    </>
  )
}
