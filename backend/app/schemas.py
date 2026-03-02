from datetime import datetime
from pydantic import BaseModel


# --- Prospect ---
class ProspectCreate(BaseModel):
    company_name: str


class ProspectResponse(BaseModel):
    id: int
    company_name: str
    status: str
    research_data: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Deal ---
class DealResponse(BaseModel):
    id: int
    prospect_id: int
    fit_score: int | None = None
    fit_verdict: str | None = None
    analysis_data: dict | None = None
    talking_points: list | None = None
    case_studies: list | None = None
    stage: str
    created_at: datetime
    prospect: ProspectResponse | None = None

    model_config = {"from_attributes": True}


# --- Outreach Draft ---
class OutreachDraftResponse(BaseModel):
    id: int
    deal_id: int
    subject_line: str | None = None
    email_body: str | None = None
    internal_notes: str | None = None
    personalization_hooks: list | None = None
    status: str
    approved_at: datetime | None = None
    created_at: datetime
    deal: DealResponse | None = None

    model_config = {"from_attributes": True}


class ApprovalAction(BaseModel):
    subject_line: str | None = None
    email_body: str | None = None
    sender_email: str | None = None
    recipient_email: str | None = None
    comment: str | None = None


# --- Pipeline Run ---
class StepResult(BaseModel):
    step: str
    status: str  # pending/running/completed/failed
    started_at: datetime | None = None
    completed_at: datetime | None = None
    output: dict | None = None
    error: str | None = None


class PipelineRunResponse(BaseModel):
    id: int
    prospect_id: int
    current_step: str | None = None
    status: str
    step_results: dict | None = None
    started_at: datetime
    completed_at: datetime | None = None
    prospect: ProspectResponse | None = None

    model_config = {"from_attributes": True}


# --- SSE ---
class SSEEvent(BaseModel):
    event_type: str
    data: dict
