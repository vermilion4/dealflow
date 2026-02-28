# DealFlow Backend

FastAPI backend that orchestrates 4 Airia AI pipelines to automate prospect research, qualification, outreach drafting, and email delivery.

## Tech Stack

- **FastAPI** — async Python web framework
- **SQLAlchemy** (async) + **aiosqlite** — SQLite database
- **Airia SDK** — pipeline execution
- **SSE-Starlette** — server-sent events for real-time updates
- **Pydantic Settings** — environment configuration

## Setup

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `.env`:

```env
AIRIA_API_KEY=your_api_key
AIRIA_PROJECT_ID=your_project_id
PROSPECT_SCOUT_PIPELINE_ID=your_pipeline_id
FIT_ANALYZER_PIPELINE_ID=your_pipeline_id
PITCH_CRAFT_PIPELINE_ID=your_pipeline_id
OUTREACH_PILOT_PIPELINE_ID=your_pipeline_id
DATABASE_URL=sqlite+aiosqlite:///./dealflow.db
FRONTEND_URL=http://localhost:3000
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

API docs available at [http://localhost:8000/docs](http://localhost:8000/docs).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/prospects/` | Create prospect and trigger research pipeline |
| `GET` | `/api/prospects/` | List all prospects |
| `GET` | `/api/prospects/{id}` | Get prospect detail |
| `GET` | `/api/deals/` | List all deals |
| `GET` | `/api/deals/{id}` | Get deal detail |
| `GET` | `/api/approvals/` | List pending outreach drafts |
| `GET` | `/api/approvals/{id}` | Get draft detail |
| `POST` | `/api/approvals/{id}/approve` | Approve and send outreach |
| `POST` | `/api/approvals/{id}/reject` | Reject outreach draft |
| `GET` | `/api/pipeline/runs` | List pipeline runs |
| `GET` | `/api/pipeline/runs/{id}` | Get run detail |
| `GET` | `/api/events/stream` | SSE event stream |

## Project Structure

```
app/
├── main.py                 # FastAPI app, CORS, lifespan
├── config.py               # Pydantic Settings from .env
├── database.py             # Async SQLAlchemy engine + sessions
├── models.py               # ORM models
├── schemas.py              # Pydantic request/response schemas
├── event_bus.py            # In-process async pub/sub for SSE
├── routers/
│   ├── prospects.py        # Prospect CRUD + pipeline trigger
│   ├── deals.py            # Deal listing
│   ├── approvals.py        # HITL approve/reject
│   ├── pipeline.py         # Run status/history
│   └── events.py           # SSE stream endpoint
└── services/
    ├── airia_client.py     # Airia SDK wrapper
    └── orchestrator.py     # 4-agent pipeline orchestration

setup/
├── pipeline_prompts.py     # System prompts for all 4 agents
└── seed_data.py            # Product catalog seed content
```

## Database Models

| Model | Description |
|-------|-------------|
| **Prospect** | Company being researched (name, status, research data) |
| **Deal** | Qualified prospect with fit score and analysis |
| **OutreachDraft** | Generated email draft pending approval |
| **PipelineRun** | Pipeline execution log with step-by-step results |
