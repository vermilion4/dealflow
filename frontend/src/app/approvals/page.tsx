"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { FileCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/ui/empty-state"
import { useToast } from "@/components/ui/toast"
import { FitScoreBadge } from "@/components/deals/fit-score-badge"
import { DraftEditor } from "@/components/approvals/draft-editor"
import { ApprovalActions } from "@/components/approvals/approval-actions"
import { listApprovals, approveDraft, rejectDraft, getConfig } from "@/lib/api"
import { groupByDate } from "@/lib/date-groups"
import { useSSE } from "@/lib/sse"
import type { OutreachDraft } from "@/lib/types"

const tabs = [
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Sent", value: "sent" },
  { label: "Rejected", value: "rejected" },
  { label: "All", value: "" },
]

const statusBadge: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-blue-100 text-blue-700",
  sent: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState("pending")
  const { data: drafts, mutate, isLoading } = useSWR<OutreachDraft[]>(
    ["approvals", activeTab],
    () => listApprovals(activeTab || undefined),
    { refreshInterval: 5000 }
  )
  const { data: config } = useSWR("config", getConfig)

  const { toast } = useToast()

  const handleSSE = useCallback(() => {
    mutate()
  }, [mutate])

  useSSE(handleSSE)

  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editedSubject, setEditedSubject] = useState("")
  const [editedBody, setEditedBody] = useState("")
  const [senderEmail, setSenderEmail] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")

  function handleExpand(draft: OutreachDraft) {
    if (expandedId === draft.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(draft.id)
    setEditedSubject(draft.subject_line || "")
    setEditedBody(draft.email_body || "")
    setSenderEmail(config?.sender_email || "")
    setRecipientEmail("")
  }

  async function handleApprove(draftId: number, companyName: string) {
    try {
      await approveDraft(draftId, {
        subject_line: editedSubject,
        email_body: editedBody,
        sender_email: senderEmail || undefined,
        recipient_email: recipientEmail || undefined,
      })
      mutate()
      setExpandedId(null)
    } catch {
      toast({
        title: "Approval failed",
        description: "Something went wrong. Please try again.",
        variant: "error",
      })
    }
  }

  async function handleReject(draftId: number, companyName: string) {
    try {
      await rejectDraft(draftId)
      toast({
        title: "Draft rejected",
        description: `Outreach for ${companyName} has been rejected.`,
        variant: "success",
      })
      mutate()
      setExpandedId(null)
    } catch {
      toast({
        title: "Rejection failed",
        description: "Something went wrong. Please try again.",
        variant: "error",
      })
    }
  }

  const grouped = drafts ? groupByDate(drafts, (d) => d.created_at) : []
  const isPending = activeTab === "pending"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Approvals</h2>
        <p className="text-muted-foreground">
          Review and approve AI-generated outreach drafts
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => { setActiveTab(tab.value); setExpandedId(null) }}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState
          icon={<FileCheck className="w-7 h-7 text-muted-foreground" />}
          title={isPending ? "No pending approvals" : "No drafts found"}
          description={
            isPending
              ? "Outreach drafts will appear here for your review once the AI pipeline generates them."
              : "No outreach drafts match this filter."
          }
        />
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.label}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{group.label}</h3>
              <div className="space-y-4">
                {group.items.map((draft) => (
                  <Card key={draft.id} className="cursor-pointer" onClick={() => handleExpand(draft)}>
                    <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between space-y-0 hover:bg-accent transition-colors duration-300">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base">
                          {draft.deal?.prospect?.company_name || `Draft #${draft.id}`}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1 truncate">
                          {draft.subject_line}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className={statusBadge[draft.status] || ""}>
                            {draft.status === "pending" ? "Pending Review" : draft.status.charAt(0).toUpperCase() + draft.status.slice(1)}
                          </Badge>
                          {draft.deal?.stage && (
                            <Badge variant="secondary" className="text-xs">
                              Deal: {draft.deal.stage.replace(/_/g, " ")}
                            </Badge>
                          )}
                          {draft.deal?.fit_verdict && (
                            <Badge variant="secondary" className="text-xs capitalize">
                              Fit: {draft.deal.fit_verdict}
                            </Badge>
                          )}
                          {draft.personalization_hooks && draft.personalization_hooks.length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {draft.personalization_hooks.length} hooks
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground self-center">
                            {new Date(draft.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {draft.deal && <FitScoreBadge score={draft.deal.fit_score} size="sm" />}
                    </CardHeader>

                    {expandedId === draft.id && (
                      <CardContent className="space-y-4" onClick={(e) => e.stopPropagation()}>
                        {isPending && (
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="text-sm font-medium mb-1 block">From (Sender)</label>
                              <Input
                                type="email"
                                placeholder="e.g. you@gmail.com"
                                value={senderEmail}
                                onChange={(e) => setSenderEmail(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Gmail address to send from.
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium mb-1 block">To (Recipient)</label>
                              <Input
                                type="email"
                                placeholder="e.g. contact@company.com"
                                value={recipientEmail}
                                onChange={(e) => setRecipientEmail(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground mt-1">
                                Email address to send the outreach to.
                              </p>
                            </div>
                          </div>
                        )}

                        {isPending ? (
                          <DraftEditor
                            subjectLine={editedSubject}
                            emailBody={editedBody}
                            onSubjectChange={setEditedSubject}
                            onBodyChange={setEditedBody}
                          />
                        ) : (
                          <div className="space-y-3">
                            <div>
                              <p className="text-sm font-medium mb-1">Subject</p>
                              <p className="text-sm text-muted-foreground">{draft.subject_line}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium mb-1">Email Body</p>
                              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{draft.email_body}</p>
                            </div>
                          </div>
                        )}

                        {draft.deal?.talking_points && draft.deal.talking_points.length > 0 && (
                          <div className="rounded-lg bg-blue-50 p-4">
                            <p className="text-sm font-medium mb-1">Talking Points</p>
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {draft.deal.talking_points.map((tp, i) => (
                                <li key={i} className="flex gap-2">
                                  <span className="text-blue-500 mt-0.5">&#8226;</span>
                                  <span>{tp}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {draft.internal_notes && (
                          <div className="rounded-lg bg-muted p-4">
                            <p className="text-sm font-medium mb-1">Internal Strategy Notes</p>
                            <p className="text-sm text-muted-foreground">{draft.internal_notes}</p>
                          </div>
                        )}

                        {draft.personalization_hooks && draft.personalization_hooks.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Personalization Hooks Used</p>
                            <div className="flex flex-wrap gap-1">
                              {draft.personalization_hooks.map((hook, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{hook}</Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {isPending && (
                          <ApprovalActions
                            onApprove={() => handleApprove(draft.id, draft.deal?.prospect?.company_name || `Draft #${draft.id}`)}
                            onReject={() => handleReject(draft.id, draft.deal?.prospect?.company_name || `Draft #${draft.id}`)}
                            companyName={draft.deal?.prospect?.company_name}
                            requiresEmail={!recipientEmail.trim()}
                          />
                        )}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
