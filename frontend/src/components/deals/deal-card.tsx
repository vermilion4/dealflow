"use client"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FitScoreBadge } from "./fit-score-badge"
import type { Deal } from "@/lib/types"

const stageLabels: Record<string, string> = {
  new: "New",
  qualified: "Qualified",
  outreach_pending: "Outreach Pending",
  outreach_sent: "Outreach Sent",
  responded: "Responded",
}

const stageColors: Record<string, string> = {
  new: "bg-gray-100 text-gray-700",
  qualified: "bg-blue-100 text-blue-700",
  outreach_pending: "bg-yellow-100 text-yellow-700",
  outreach_sent: "bg-green-100 text-green-700",
  responded: "bg-purple-100 text-purple-700",
}

export function DealCard({ deal }: { deal: Deal }) {
  const prospectStatus = deal.prospect?.status
  const industry = deal.prospect?.research_data?.industry
  const employeeCount = deal.prospect?.research_data?.employee_count_estimate

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base">
            {deal.prospect?.company_name || `Prospect #${deal.prospect_id}`}
          </CardTitle>
          {(industry || employeeCount) && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {[industry, employeeCount].filter(Boolean).join(" · ")}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1.5">
            <Badge variant="outline" className={stageColors[deal.stage] || ""}>
              {stageLabels[deal.stage] || deal.stage}
            </Badge>
            {deal.fit_verdict && (
              <Badge variant="secondary" className="text-xs capitalize">
                {deal.fit_verdict}
              </Badge>
            )}
            {prospectStatus && (
              <span className="text-xs text-muted-foreground capitalize">
                {prospectStatus.replace(/_/g, " ")}
              </span>
            )}
          </div>
        </div>
        <FitScoreBadge score={deal.fit_score} />
      </CardHeader>
      <CardContent className="space-y-3">
        {deal.analysis_data?.recommended_approach && (
          <div className="rounded-md bg-blue-50 p-3">
            <p className="text-xs font-medium text-blue-700 mb-0.5">Recommended Approach</p>
            <p className="text-sm text-blue-900">{deal.analysis_data.recommended_approach}</p>
          </div>
        )}

        {deal.talking_points && deal.talking_points.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Talking Points</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {deal.talking_points.slice(0, 3).map((tp, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-primary mt-0.5 shrink-0">&#8226;</span>
                  <span>{tp}</span>
                </li>
              ))}
              {deal.talking_points.length > 3 && (
                <li className="text-xs text-muted-foreground/60">
                  +{deal.talking_points.length - 3} more
                </li>
              )}
            </ul>
          </div>
        )}

        {deal.case_studies && deal.case_studies.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Matched Case Studies</p>
            {deal.case_studies.map((cs, i) => (
              <div key={i} className="text-sm text-muted-foreground">
                <span className="font-medium">{cs.title}</span>
                {cs.relevance && <span> &mdash; {cs.relevance}</span>}
              </div>
            ))}
          </div>
        )}

        {deal.analysis_data?.risks && deal.analysis_data.risks.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Risks</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {deal.analysis_data.risks.map((r, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-destructive mt-0.5">!</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {deal.analysis_data?.sub_scores && (
          <div>
            <p className="text-sm font-medium mb-2">Score Breakdown</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(deal.analysis_data.sub_scores).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                  <span className="font-medium">{value}/20</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 border-t text-xs text-muted-foreground">
          Created {new Date(deal.created_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  )
}
