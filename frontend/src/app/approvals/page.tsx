"use client"

import { useState, useCallback } from "react"
import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { FitScoreBadge } from "@/components/deals/fit-score-badge"
import { DraftEditor } from "@/components/approvals/draft-editor"
import { ApprovalActions } from "@/components/approvals/approval-actions"
import { listPendingApprovals, approveDraft, rejectDraft } from "@/lib/api"
import { useSSE } from "@/lib/sse"
import type { OutreachDraft } from "@/lib/types"

export default function ApprovalsPage() {
  const { data: drafts, mutate, isLoading } = useSWR<OutreachDraft[]>(
    "approvals",
    listPendingApprovals,
    { refreshInterval: 5000 }
  )

  const handleSSE = useCallback(() => {
    mutate()
  }, [mutate])

  useSSE(handleSSE)

  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [editedSubject, setEditedSubject] = useState("")
  const [editedBody, setEditedBody] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")

  function handleExpand(draft: OutreachDraft) {
    if (expandedId === draft.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(draft.id)
    setEditedSubject(draft.subject_line || "")
    setEditedBody(draft.email_body || "")
    setRecipientEmail("")
  }

  async function handleApprove(draftId: number) {
    await approveDraft(draftId, {
      subject_line: editedSubject,
      email_body: editedBody,
      recipient_email: recipientEmail || undefined,
    })
    mutate()
    setExpandedId(null)
  }

  async function handleReject(draftId: number) {
    await rejectDraft(draftId)
    mutate()
    setExpandedId(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Approvals</h2>
        <p className="text-muted-foreground">
          Review and approve AI-generated outreach drafts
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      ) : !drafts || drafts.length === 0 ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          No pending approvals. Drafts will appear here after the pipeline runs.
        </div>
      ) : (
        <div className="space-y-4">
          {drafts.map((draft) => (
            <Card key={draft.id} className="cursor-pointer" onClick={() => handleExpand(draft)}>
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between space-y-0">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base">
                    {draft.deal?.prospect?.company_name || `Draft #${draft.id}`}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1 truncate">
                    {draft.subject_line}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-700">
                      Pending Review
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
                  </div>
                </div>
                {draft.deal && <FitScoreBadge score={draft.deal.fit_score} size="sm" />}
              </CardHeader>

              {expandedId === draft.id && (
                <CardContent className="space-y-4" onClick={(e) => e.stopPropagation()}>
                  {/* Recipient email */}
                  <div>
                    <label className="text-sm font-medium mb-1 block">Recipient Email</label>
                    <Input
                      type="email"
                      placeholder="e.g. contact@company.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Email address to send the outreach to. Leave blank to skip sending.
                    </p>
                  </div>

                  <DraftEditor
                    subjectLine={editedSubject}
                    emailBody={editedBody}
                    onSubjectChange={setEditedSubject}
                    onBodyChange={setEditedBody}
                  />

                  {/* Talking points from deal analysis */}
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

                  <ApprovalActions
                    onApprove={() => handleApprove(draft.id)}
                    onReject={() => handleReject(draft.id)}
                  />
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
