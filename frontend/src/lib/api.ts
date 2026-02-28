import type { Prospect, Deal, OutreachDraft, PipelineRun } from "./types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

async function fetchAPI<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const error = await res.text()
    throw new Error(`API error ${res.status}: ${error}`)
  }
  return res.json()
}

// Prospects
export async function createProspect(companyName: string): Promise<Prospect> {
  return fetchAPI<Prospect>("/prospects/", {
    method: "POST",
    body: JSON.stringify({ company_name: companyName }),
  })
}

export async function listProspects(): Promise<Prospect[]> {
  return fetchAPI<Prospect[]>("/prospects/")
}

export async function getProspect(id: number): Promise<Prospect> {
  return fetchAPI<Prospect>(`/prospects/${id}`)
}

// Deals
export async function listDeals(stage?: string): Promise<Deal[]> {
  const query = stage ? `?stage=${stage}` : ""
  return fetchAPI<Deal[]>(`/deals/${query}`)
}

export async function getDeal(id: number): Promise<Deal> {
  return fetchAPI<Deal>(`/deals/${id}`)
}

// Approvals
export async function listPendingApprovals(): Promise<OutreachDraft[]> {
  return fetchAPI<OutreachDraft[]>("/approvals/")
}

export async function getDraft(id: number): Promise<OutreachDraft> {
  return fetchAPI<OutreachDraft>(`/approvals/${id}`)
}

export async function approveDraft(
  id: number,
  edits?: { subject_line?: string; email_body?: string; recipient_email?: string; comment?: string }
): Promise<OutreachDraft> {
  return fetchAPI<OutreachDraft>(`/approvals/${id}/approve`, {
    method: "POST",
    body: JSON.stringify(edits || {}),
  })
}

export async function rejectDraft(
  id: number,
  comment?: string
): Promise<OutreachDraft> {
  return fetchAPI<OutreachDraft>(`/approvals/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ comment }),
  })
}

// Pipeline
export async function listPipelineRuns(): Promise<PipelineRun[]> {
  return fetchAPI<PipelineRun[]>("/pipeline/runs")
}

export async function getPipelineRun(id: number): Promise<PipelineRun> {
  return fetchAPI<PipelineRun>(`/pipeline/runs/${id}`)
}

// SWR fetcher
export const fetcher = <T>(url: string): Promise<T> => fetchAPI<T>(url)
