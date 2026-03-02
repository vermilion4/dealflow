import asyncio
import datetime
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.event_bus import event_bus
from app.models import OutreachDraft, Deal
from app.schemas import ApprovalAction, OutreachDraftResponse
from app.services.orchestrator import send_approved_outreach

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/approvals", tags=["approvals"])


@router.get("/", response_model=list[OutreachDraftResponse])
async def list_pending_approvals(db: AsyncSession = Depends(get_db)):
    """List all outreach drafts pending approval."""
    result = await db.execute(
        select(OutreachDraft)
        .options(selectinload(OutreachDraft.deal).selectinload(Deal.prospect))
        .where(OutreachDraft.status == "pending")
        .order_by(OutreachDraft.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{draft_id}", response_model=OutreachDraftResponse)
async def get_draft(draft_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific outreach draft."""
    result = await db.execute(
        select(OutreachDraft)
        .options(selectinload(OutreachDraft.deal).selectinload(Deal.prospect))
        .where(OutreachDraft.id == draft_id)
    )
    draft = result.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    return draft


@router.post("/{draft_id}/approve", response_model=OutreachDraftResponse)
async def approve_draft(
    draft_id: int,
    body: ApprovalAction | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Approve an outreach draft and trigger sending."""
    result = await db.execute(
        select(OutreachDraft)
        .options(selectinload(OutreachDraft.deal).selectinload(Deal.prospect))
        .where(OutreachDraft.id == draft_id)
    )
    draft = result.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    if draft.status != "pending":
        raise HTTPException(status_code=400, detail=f"Draft is already {draft.status}")

    # Apply edits if provided
    if body:
        if body.subject_line:
            draft.subject_line = body.subject_line
        if body.email_body:
            draft.email_body = body.email_body

    draft.status = "approved"
    draft.approved_at = datetime.datetime.utcnow()
    await db.commit()
    await db.refresh(draft, attribute_names=["id", "status", "approved_at", "subject_line", "email_body"])

    await event_bus.publish("draft_approved", {"draft_id": draft.id})

    # Fire and forget outreach sending (with error logging)
    recipient = body.recipient_email if body and body.recipient_email else None
    sender = body.sender_email if body and body.sender_email else None

    async def _send_with_logging():
        try:
            await send_approved_outreach(draft.id, recipient_email=recipient, sender_email=sender)
        except Exception as e:
            import traceback
            print(f"[OutreachPilot] FAILED for draft {draft.id}: {e}")
            traceback.print_exc()

    asyncio.create_task(_send_with_logging())

    return draft


@router.post("/{draft_id}/reject", response_model=OutreachDraftResponse)
async def reject_draft(
    draft_id: int,
    body: ApprovalAction | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Reject an outreach draft."""
    result = await db.execute(
        select(OutreachDraft)
        .options(selectinload(OutreachDraft.deal).selectinload(Deal.prospect))
        .where(OutreachDraft.id == draft_id)
    )
    draft = result.scalar_one_or_none()
    if not draft:
        raise HTTPException(status_code=404, detail="Draft not found")
    if draft.status != "pending":
        raise HTTPException(status_code=400, detail=f"Draft is already {draft.status}")

    draft.status = "rejected"
    await db.commit()
    await db.refresh(draft, attribute_names=["id", "status"])

    await event_bus.publish("draft_rejected", {"draft_id": draft.id})
    return draft
