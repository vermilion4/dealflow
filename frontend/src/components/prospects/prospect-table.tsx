"use client"

import { useState } from "react"
import { Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EmptyState } from "@/components/ui/empty-state"
import { FitScoreBadge } from "@/components/deals/fit-score-badge"
import type { Prospect, Deal, ResearchData } from "@/lib/types"

const statusColors: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  researching: "bg-blue-100 text-blue-700",
  researched: "bg-blue-200 text-blue-800",
  analyzing: "bg-yellow-100 text-yellow-700",
  analyzed: "bg-yellow-200 text-yellow-800",
  drafting: "bg-purple-100 text-purple-700",
  drafted: "bg-purple-200 text-purple-800",
  approved: "bg-green-100 text-green-700",
  sent: "bg-green-200 text-green-800",
  failed: "bg-red-100 text-red-700",
}

/** Strip firecrawl XML tool tags and clean up the text */
function cleanResearchText(text: string): string {
  // Remove <firecrawl_web_scraper>...</firecrawl_web_scraper> blocks
  let cleaned = text.replace(/<firecrawl_web_scraper>[\s\S]*?<\/firecrawl_web_scraper>/g, "")
  // Remove any other XML-like tool tags
  cleaned = cleaned.replace(/<\/?[a-z_]+>/g, "")
  // Remove leading preamble like "I'll help you research..."
  cleaned = cleaned.replace(/^[\s\S]*?(?=##\s|###\s|\*\*[A-Z])/m, "")
  // Clean up excessive blank lines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n")
  return cleaned.trim()
}

/** Parse markdown-ish text into sections */
function parseSections(text: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = []
  // Split on ## or ### headings
  const parts = text.split(/^(?=#{1,3}\s)/m)

  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue

    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)/)
    if (headingMatch) {
      const title = headingMatch[1].replace(/\*\*/g, "").trim()
      const content = trimmed.slice(headingMatch[0].length).trim()
      if (content) {
        sections.push({ title, content })
      }
    } else if (trimmed.length > 20) {
      // Non-heading content that's meaningful
      sections.push({ title: "Overview", content: trimmed })
    }
  }

  return sections
}

/** Render a text block, handling markdown lists and bold */
function RenderContent({ text }: { text: string }) {
  const lines = text.split("\n").filter((l) => l.trim())

  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        const trimmed = line.trim()
        // Bullet/numbered list items
        if (trimmed.match(/^[-*]\s/) || trimmed.match(/^\d+\.\s/)) {
          const content = trimmed.replace(/^[-*]\s+/, "").replace(/^\d+\.\s+/, "")
          return (
            <div key={i} className="flex gap-2 text-sm text-muted-foreground">
              <span className="text-primary mt-0.5 shrink-0">&#8226;</span>
              <span dangerouslySetInnerHTML={{ __html: boldify(content) }} />
            </div>
          )
        }
        // Regular text
        return (
          <p key={i} className="text-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: boldify(trimmed) }} />
        )
      })}
    </div>
  )
}

/** Convert **bold** markdown to <strong> tags */
function boldify(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "<strong class='text-foreground'>$1</strong>")
}

/** Get the best text content from research data */
function getResearchText(rd: ResearchData): string | null {
  if (rd.markdown) return rd.markdown
  if (rd.raw && typeof rd.raw === "string") return cleanResearchText(rd.raw)
  return null
}

function hasExpandableData(prospect: Prospect): boolean {
  const rd = prospect.research_data
  if (!rd) return false
  return !!(
    rd.summary ||
    rd.industry ||
    (rd.pain_points && rd.pain_points.length > 0) ||
    (rd.tech_stack_indicators && rd.tech_stack_indicators.length > 0) ||
    rd.raw ||
    rd.markdown
  )
}

interface ProspectTableProps {
  prospects: Prospect[]
  deals?: Deal[]
}

export function ProspectTable({ prospects, deals = [] }: ProspectTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const dealByProspect = new Map<number, Deal>()
  for (const deal of deals) {
    if (!dealByProspect.has(deal.prospect_id)) {
      dealByProspect.set(deal.prospect_id, deal)
    }
  }

  if (prospects.length === 0) {
    return (
      <EmptyState
        icon={<Search className="w-7 h-7 text-muted-foreground" />}
        title="No prospects yet"
        description="Start by researching a company. Click &quot;New Research&quot; above to begin prospecting."
      />
    )
  }

  return (
    <div className="space-y-2">
      {/* Desktop header */}
      <div className="hidden md:grid grid-cols-[1fr_100px_150px_180px] gap-4 px-4 py-2 text-sm font-medium text-muted-foreground">
        <div>Company</div>
        <div className="text-center">Fit Score</div>
        <div>Status</div>
        <div>Created</div>
      </div>
      {prospects.map((prospect) => {
        const expandable = hasExpandableData(prospect)
        const deal = dealByProspect.get(prospect.id)
        const rd = prospect.research_data
        const researchText = rd ? getResearchText(rd) : null
        const sections = researchText ? parseSections(researchText) : []

        return (
          <div key={prospect.id}>
            {/* Mobile layout */}
            <div
              className={`md:hidden flex items-center justify-between px-4 py-3 rounded-lg border bg-card transition-colors ${
                expandable ? "hover:bg-accent/50 cursor-pointer" : ""
              }`}
              onClick={() => {
                if (!expandable) return
                setExpandedId(expandedId === prospect.id ? null : prospect.id)
              }}
            >
              <div className="min-w-0">
                <div className="font-medium">{prospect.company_name}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className={`text-xs ${statusColors[prospect.status] || ""}`}>
                    {prospect.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(prospect.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {deal && <FitScoreBadge score={deal.fit_score} size="sm" />}
            </div>

            {/* Desktop layout */}
            <div
              className={`hidden md:grid grid-cols-[1fr_100px_150px_180px] gap-4 items-center px-4 py-3 rounded-lg border bg-card transition-colors ${
                expandable ? "hover:bg-accent/50 cursor-pointer" : ""
              }`}
              onClick={() => {
                if (!expandable) return
                setExpandedId(expandedId === prospect.id ? null : prospect.id)
              }}
            >
              <div className="font-medium">{prospect.company_name}</div>
              <div className="flex justify-center">
                {deal ? (
                  <FitScoreBadge score={deal.fit_score} size="sm" />
                ) : (
                  <span className="text-xs text-muted-foreground">--</span>
                )}
              </div>
              <div>
                <Badge variant="outline" className={statusColors[prospect.status] || ""}>
                  {prospect.status}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {new Date(prospect.created_at).toLocaleDateString()}
              </div>
            </div>

            {expandedId === prospect.id && expandable && rd && (
              <Card className="mt-1 mx-0 md:mx-4">
                <CardContent className="pt-4 space-y-4">
                  {/* Structured fields (if the AI returned proper JSON) */}
                  {rd.summary && (
                    <div>
                      <p className="text-sm font-medium mb-1">Summary</p>
                      <p className="text-sm text-muted-foreground">{rd.summary}</p>
                    </div>
                  )}
                  {rd.industry && (
                    <div className="flex gap-4">
                      {rd.industry && (
                        <div>
                          <p className="text-sm font-medium mb-1">Industry</p>
                          <Badge variant="secondary">{rd.industry}</Badge>
                        </div>
                      )}
                      {rd.employee_count_estimate && (
                        <div>
                          <p className="text-sm font-medium mb-1">Size</p>
                          <Badge variant="secondary">{rd.employee_count_estimate}</Badge>
                        </div>
                      )}
                    </div>
                  )}
                  {rd.pain_points && rd.pain_points.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Pain Points</p>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {rd.pain_points.map((p, i) => (
                          <li key={i} className="flex gap-2">
                            <span className="text-primary mt-0.5">&#8226;</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {rd.tech_stack_indicators && rd.tech_stack_indicators.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Tech Stack</p>
                      <div className="flex flex-wrap gap-1">
                        {rd.tech_stack_indicators.map((t, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{t}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Parsed sections from raw/markdown text */}
                  {sections.length > 0 && (
                    <div className="space-y-3">
                      {sections.map((section, i) => (
                        <div key={i}>
                          <p className="text-sm font-medium mb-1">{section.title}</p>
                          <RenderContent text={section.content} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Fallback: show raw text if no sections parsed */}
                  {sections.length === 0 && researchText && (
                    <div>
                      <p className="text-sm font-medium mb-1">Research Output</p>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">{researchText}</p>
                    </div>
                  )}

                  {/* Deal info */}
                  {deal && deal.fit_verdict && (
                    <div className="pt-2 border-t">
                      <p className="text-sm font-medium mb-1">Fit Verdict</p>
                      <Badge variant="secondary" className="capitalize">{deal.fit_verdict}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )
      })}
    </div>
  )
}
