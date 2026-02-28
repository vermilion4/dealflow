from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import PipelineRun
from app.schemas import PipelineRunResponse

router = APIRouter(prefix="/pipeline", tags=["pipeline"])


@router.get("/runs", response_model=list[PipelineRunResponse])
async def list_runs(db: AsyncSession = Depends(get_db)):
    """List all pipeline runs ordered by most recent."""
    result = await db.execute(
        select(PipelineRun)
        .options(selectinload(PipelineRun.prospect))
        .order_by(PipelineRun.started_at.desc())
    )
    return result.scalars().all()


@router.get("/runs/{run_id}", response_model=PipelineRunResponse)
async def get_run(run_id: int, db: AsyncSession = Depends(get_db)):
    """Get a specific pipeline run with step details."""
    result = await db.execute(
        select(PipelineRun)
        .options(selectinload(PipelineRun.prospect))
        .where(PipelineRun.id == run_id)
    )
    run = result.scalar_one_or_none()
    if not run:
        raise HTTPException(status_code=404, detail="Pipeline run not found")
    return run
