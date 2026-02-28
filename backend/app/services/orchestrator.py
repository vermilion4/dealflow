import json
import datetime
import logging
import traceback
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

from app.config import settings
from app.database import async_session
from app.event_bus import event_bus
from app.models import Deal, OutreachDraft, PipelineRun, Prospect
from app.services.airia_client import airia_client


async def _emit(event_type: str, data: dict):
    await event_bus.publish(event_type, data)


async def _update_prospect_status(session: AsyncSession, prospect_id: int, status: str):
    prospect = await session.get(Prospect, prospect_id)
    if prospect:
        prospect.status = status
        await session.commit()
        await _emit("prospect_status", {"prospect_id": prospect_id, "status": status})


async def _update_run_step(
    session: AsyncSession,
    run: PipelineRun,
    step: str,
    step_status: str,
    output: dict | None = None,
    error: str | None = None,
):
    run.current_step = step
    results = dict(run.step_results or {})
    results[step] = {
        "status": step_status,
        "timestamp": datetime.datetime.utcnow().isoformat(),
    }
    if output:
        results[step]["output"] = output
    if error:
        results[step]["error"] = error
    # Assign a new dict so SQLAlchemy detects the change on JSON column
    run.step_results = results
    await session.commit()
    await _emit("pipeline_step", {
        "run_id": run.id,
        "prospect_id": run.prospect_id,
        "step": step,
        "status": step_status,
        "error": error,
    })


async def run_full_pipeline(prospect_id: int, company_name: str):
    """Chain all 4 agents sequentially with state management and SSE updates."""
    async with async_session() as session:
        # Create pipeline run
        run = PipelineRun(prospect_id=prospect_id, status="running", current_step="prospect_scout")
        session.add(run)
        await session.commit()
        await session.refresh(run)
        await _emit("pipeline_started", {"run_id": run.id, "prospect_id": prospect_id})

        try:
            # --- Step 1: ProspectScout ---
            await _update_prospect_status(session, prospect_id, "researching")
            await _update_run_step(session, run, "prospect_scout", "running")

            scout_result = await airia_client.execute_pipeline(
                pipeline_id=settings.PROSPECT_SCOUT_PIPELINE_ID,
                user_input=f"Research the company: {company_name}",
            )
            research_data = scout_result["output"]

            # Save research data to prospect
            prospect = await session.get(Prospect, prospect_id)
            prospect.research_data = research_data if isinstance(research_data, dict) else {"raw": research_data}
            await session.commit()

            await _update_prospect_status(session, prospect_id, "researched")
            await _update_run_step(session, run, "prospect_scout", "completed", output={"summary": "Research completed"})

            # --- Step 2: FitAnalyzer ---
            await _update_prospect_status(session, prospect_id, "analyzing")
            await _update_run_step(session, run, "fit_analyzer", "running")

            research_input = json.dumps(research_data) if isinstance(research_data, dict) else str(research_data)
            analyzer_result = await airia_client.execute_pipeline(
                pipeline_id=settings.FIT_ANALYZER_PIPELINE_ID,
                user_input=f"Analyze fit for this prospect:\n{research_input}",
            )
            analysis_data = analyzer_result["output"]

            # Create Deal record
            deal = Deal(
                prospect_id=prospect_id,
                fit_score=analysis_data.get("overall_score") if isinstance(analysis_data, dict) else None,
                fit_verdict=analysis_data.get("fit_verdict") if isinstance(analysis_data, dict) else None,
                analysis_data=analysis_data if isinstance(analysis_data, dict) else {"raw": analysis_data},
                talking_points=analysis_data.get("talking_points") if isinstance(analysis_data, dict) else None,
                case_studies=analysis_data.get("matched_case_studies") if isinstance(analysis_data, dict) else None,
                stage="qualified",
            )
            session.add(deal)
            await session.commit()
            await session.refresh(deal)

            await _update_prospect_status(session, prospect_id, "analyzed")
            await _update_run_step(session, run, "fit_analyzer", "completed", output={"deal_id": deal.id})
            await _emit("deal_created", {"deal_id": deal.id, "prospect_id": prospect_id, "fit_score": deal.fit_score})

            # --- Step 3: PitchCraft ---
            await _update_prospect_status(session, prospect_id, "drafting")
            await _update_run_step(session, run, "pitch_craft", "running")

            pitch_input = json.dumps({
                "research": research_data if isinstance(research_data, dict) else {"raw": research_data},
                "analysis": analysis_data if isinstance(analysis_data, dict) else {"raw": analysis_data},
            })
            pitch_result = await airia_client.execute_pipeline(
                pipeline_id=settings.PITCH_CRAFT_PIPELINE_ID,
                user_input=f"Generate outreach email based on:\n{pitch_input}",
            )
            pitch_data = pitch_result["output"]

            # Create OutreachDraft
            draft = OutreachDraft(
                deal_id=deal.id,
                subject_line=pitch_data.get("subject_line") if isinstance(pitch_data, dict) else None,
                email_body=pitch_data.get("email_body") if isinstance(pitch_data, dict) else str(pitch_data),
                internal_notes=pitch_data.get("internal_notes") if isinstance(pitch_data, dict) else None,
                personalization_hooks=pitch_data.get("personalization_hooks") if isinstance(pitch_data, dict) else None,
                status="pending",
            )
            session.add(draft)
            deal.stage = "outreach_pending"
            await session.commit()
            await session.refresh(draft)

            await _update_prospect_status(session, prospect_id, "drafted")
            await _update_run_step(session, run, "pitch_craft", "completed", output={"draft_id": draft.id})
            await _emit("draft_created", {"draft_id": draft.id, "deal_id": deal.id, "prospect_id": prospect_id})

            # --- Pipeline pauses here for HITL approval ---
            run.status = "paused"
            run.current_step = "awaiting_approval"
            await session.commit()
            await _emit("pipeline_paused", {
                "run_id": run.id,
                "prospect_id": prospect_id,
                "reason": "Awaiting HITL approval of outreach draft",
            })

        except Exception as e:
            error_msg = f"{type(e).__name__}: {str(e)}"
            tb = traceback.format_exc()
            run.status = "failed"
            await session.commit()
            await _update_run_step(session, run, run.current_step or "unknown", "failed", error=error_msg)
            await _update_prospect_status(session, prospect_id, "failed")
            await _emit("pipeline_failed", {"run_id": run.id, "prospect_id": prospect_id, "error": error_msg})
            raise


async def send_approved_outreach(draft_id: int, recipient_email: str | None = None):
    """Step 4: OutreachPilot — sends the approved email."""
    print(f"[OutreachPilot] Starting for draft_id={draft_id}, recipient={recipient_email}")
    async with async_session() as session:
        draft = await session.get(OutreachDraft, draft_id)
        if not draft:
            print(f"[OutreachPilot] Draft {draft_id} not found")
            raise ValueError(f"Draft {draft_id} not found")

        deal = await session.get(Deal, draft.deal_id)
        prospect = await session.get(Prospect, deal.prospect_id)
        print(f"[OutreachPilot] Prospect: {prospect.company_name}, Deal: {deal.id}")

        # Find the paused pipeline run
        result = await session.execute(
            select(PipelineRun).where(
                PipelineRun.prospect_id == prospect.id,
                PipelineRun.status == "paused",
            )
        )
        run = result.scalar_one_or_none()
        print(f"[OutreachPilot] Pipeline run found: {run.id if run else 'None'}")

        if run:
            run.status = "running"
            run.current_step = "outreach_pilot"
            await session.commit()
            await _update_run_step(session, run, "outreach_pilot", "running")

        # Use provided recipient email, or fall back to a placeholder
        to_email = recipient_email or "prospect@example.com"

        try:
            outreach_input = json.dumps({
                "action": "send_email",
                "to_email": to_email,
                "subject": draft.subject_line,
                "body": draft.email_body,
                "prospect_company": prospect.company_name,
                "deal_id": deal.id,
            })
            print(f"[OutreachPilot] Calling Airia pipeline {settings.OUTREACH_PILOT_PIPELINE_ID}")
            print(f"[OutreachPilot] Input: {outreach_input[:200]}...")

            pilot_result = await airia_client.execute_pipeline(
                pipeline_id=settings.OUTREACH_PILOT_PIPELINE_ID,
                user_input=outreach_input,
            )
            print(f"[OutreachPilot] Airia response: {json.dumps(pilot_result.get('output', ''), default=str)[:500]}")

            # Update statuses
            draft.status = "sent"
            deal.stage = "outreach_sent"
            prospect.status = "sent"
            await session.commit()

            if run:
                run.status = "completed"
                run.completed_at = datetime.datetime.utcnow()
                await session.commit()
                await _update_run_step(session, run, "outreach_pilot", "completed")

            await _emit("outreach_sent", {
                "draft_id": draft.id,
                "deal_id": deal.id,
                "prospect_id": prospect.id,
            })
            print(f"[OutreachPilot] Completed successfully for draft {draft_id}")

        except Exception as e:
            error_msg = str(e)
            print(f"[OutreachPilot] Failed: {error_msg}", exc_info=True)
            if run:
                run.status = "failed"
                await session.commit()
                await _update_run_step(session, run, "outreach_pilot", "failed", error=error_msg)
            raise
