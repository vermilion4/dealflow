import datetime
from sqlalchemy import DateTime, ForeignKey, Integer, JSON, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Prospect(Base):
    __tablename__ = "prospects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(
        String(50), default="pending"
    )  # pending/researching/researched/analyzing/analyzed/drafting/drafted/approved/sent/failed
    research_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    deals: Mapped[list["Deal"]] = relationship(back_populates="prospect", cascade="all, delete-orphan")
    pipeline_runs: Mapped[list["PipelineRun"]] = relationship(back_populates="prospect", cascade="all, delete-orphan")


class Deal(Base):
    __tablename__ = "deals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    prospect_id: Mapped[int] = mapped_column(Integer, ForeignKey("prospects.id"), nullable=False)
    fit_score: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fit_verdict: Mapped[str | None] = mapped_column(String(50), nullable=True)  # strong/moderate/weak/not_recommended
    analysis_data: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    talking_points: Mapped[list | None] = mapped_column(JSON, nullable=True)
    case_studies: Mapped[list | None] = mapped_column(JSON, nullable=True)
    stage: Mapped[str] = mapped_column(
        String(50), default="new"
    )  # new/qualified/outreach_pending/outreach_sent/responded
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    prospect: Mapped["Prospect"] = relationship(back_populates="deals")
    outreach_drafts: Mapped[list["OutreachDraft"]] = relationship(back_populates="deal", cascade="all, delete-orphan")


class OutreachDraft(Base):
    __tablename__ = "outreach_drafts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    deal_id: Mapped[int] = mapped_column(Integer, ForeignKey("deals.id"), nullable=False)
    subject_line: Mapped[str | None] = mapped_column(String(500), nullable=True)
    email_body: Mapped[str | None] = mapped_column(Text, nullable=True)
    internal_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    personalization_hooks: Mapped[list | None] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), default="pending"
    )  # pending/approved/rejected/sent
    approved_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now()
    )

    deal: Mapped["Deal"] = relationship(back_populates="outreach_drafts")


class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    prospect_id: Mapped[int] = mapped_column(Integer, ForeignKey("prospects.id"), nullable=False)
    current_step: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50), default="running"
    )  # running/paused/completed/failed
    step_results: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    started_at: Mapped[datetime.datetime] = mapped_column(
        DateTime, server_default=func.now()
    )
    completed_at: Mapped[datetime.datetime | None] = mapped_column(DateTime, nullable=True)

    prospect: Mapped["Prospect"] = relationship(back_populates="pipeline_runs")
