import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Prospect
from app.schemas import ProspectCreate, ProspectResponse
from app.services.orchestrator import run_full_pipeline

router = APIRouter(prefix="/prospects", tags=["prospects"])


@router.post("/", response_model=ProspectResponse, status_code=201)
async def create_prospect(body: ProspectCreate, db: AsyncSession = Depends(get_db)):
    """Create a new prospect and trigger the research pipeline."""
    prospect = Prospect(company_name=body.company_name, status="pending")
    db.add(prospect)
    await db.commit()
    await db.refresh(prospect)

    # Fire and forget the pipeline
    asyncio.create_task(run_full_pipeline(prospect.id, body.company_name))

    return prospect


@router.get("/", response_model=list[ProspectResponse])
async def list_prospects(db: AsyncSession = Depends(get_db)):
    """List all prospects ordered by creation date."""
    result = await db.execute(select(Prospect).order_by(Prospect.created_at.desc()))
    return result.scalars().all()


@router.get("/{prospect_id}", response_model=ProspectResponse)
async def get_prospect(prospect_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single prospect by ID."""
    prospect = await db.get(Prospect, prospect_id)
    if not prospect:
        raise HTTPException(status_code=404, detail="Prospect not found")
    return prospect
