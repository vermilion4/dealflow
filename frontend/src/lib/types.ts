export interface Prospect {
  id: number
  company_name: string
  status: string
  research_data: ResearchData | null
  created_at: string
}

export interface ResearchData {
  company_name?: string
  website_url?: string
  industry?: string
  employee_count_estimate?: string
  products_services?: string[]
  pain_points?: string[]
  decision_maker_titles?: string[]
  tech_stack_indicators?: string[]
  recent_news?: string[]
  summary?: string
  raw?: string
  markdown?: string
}

export interface Deal {
  id: number
  prospect_id: number
  fit_score: number | null
  fit_verdict: string | null
  analysis_data: AnalysisData | null
  talking_points: string[] | null
  case_studies: CaseStudyMatch[] | null
  stage: string
  created_at: string
  prospect: Prospect | null
}

export interface AnalysisData {
  overall_score?: number
  sub_scores?: Record<string, number>
  talking_points?: string[]
  matched_case_studies?: CaseStudyMatch[]
  risks?: string[]
  recommended_approach?: string
  fit_verdict?: string
  raw?: string
}

export interface CaseStudyMatch {
  title: string
  relevance: string
}

export interface OutreachDraft {
  id: number
  deal_id: number
  subject_line: string | null
  email_body: string | null
  internal_notes: string | null
  personalization_hooks: string[] | null
  status: string
  approved_at: string | null
  created_at: string
  deal: Deal | null
}

export interface PipelineRun {
  id: number
  prospect_id: number
  current_step: string | null
  status: string
  step_results: Record<string, StepResult> | null
  started_at: string
  completed_at: string | null
  prospect: Prospect | null
}

export interface StepResult {
  status: string
  timestamp?: string
  output?: Record<string, unknown>
  error?: string
}

export interface SSEEvent {
  event_type: string
  data: Record<string, unknown>
}
