from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import Deal
from app.schemas import DealResponse

router = APIRouter(prefix="/deals", tags=["deals"])


@router.get("/", response_model=list[DealResponse])
async def list_deals(
    stage: str | None = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List all deals, optionally filtered by stage."""
    query = select(Deal).options(selectinload(Deal.prospect)).order_by(Deal.created_at.desc())
    if stage:
        query = query.where(Deal.stage == stage)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{deal_id}", response_model=DealResponse)
async def get_deal(deal_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single deal with full analysis data."""
    result = await db.execute(
        select(Deal).options(selectinload(Deal.prospect)).where(Deal.id == deal_id)
    )
    deal = result.scalar_one_or_none()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal
