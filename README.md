# DealFlow

AI-powered multi-agent sales pipeline accelerator built for the [Airia AI Agent Challenge](https://airia.com) hackathon (Active Agents track).

DealFlow eliminates hours of manual prospect research, qualification, and outreach drafting by chaining 4 specialized AI agents through the Airia platform — with human-in-the-loop approval before any email goes out.

## How It Works

```
User enters company name
        │
   1. ProspectScout  ─── Researches company via Firecrawl web scraping
        │
   2. FitAnalyzer    ─── Scores fit using RAG against product catalog + Memory
        │
   3. PitchCraft     ─── Generates personalized outreach email
        │
   [Human reviews & approves draft on dashboard]
        │
   4. OutreachPilot   ─── Sends approved email via Outlook
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python, FastAPI, SQLAlchemy (async), SQLite |
| Frontend | Next.js 16, TypeScript, Tailwind CSS, shadcn/ui, SWR |
| AI Platform | Airia (Pipelines, Data Store, Structured Output) |
| Airia Tools | Firecrawl (web scraping), Outlook (email delivery) |
| Real-time | Server-Sent Events (SSE) |

## Project Structure

```
dealflow/
├── backend/          # FastAPI backend with Airia pipeline orchestration
│   ├── app/
│   │   ├── main.py           # App entry point, CORS, lifespan
│   │   ├── config.py         # Environment configuration
│   │   ├── database.py       # Async SQLAlchemy setup
│   │   ├── models.py         # ORM models (Prospect, Deal, OutreachDraft, PipelineRun)
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── event_bus.py      # In-process pub/sub for SSE
│   │   ├── routers/          # API route handlers
│   │   └── services/         # Airia client + pipeline orchestrator
│   └── setup/                # Pipeline prompts + seed data
│
└── frontend/         # Next.js dashboard
    └── src/
        ├── app/              # Pages: prospects, deals, approvals, pipeline
        ├── components/       # UI components
        └── lib/              # API client, SSE hook, types
```

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- [Airia](https://airia.com) account with API key and configured pipelines

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
AIRIA_API_KEY=your_api_key
AIRIA_PROJECT_ID=your_project_id
PROSPECT_SCOUT_PIPELINE_ID=...
FIT_ANALYZER_PIPELINE_ID=...
PITCH_CRAFT_PIPELINE_ID=...
OUTREACH_PILOT_PIPELINE_ID=...
```

Run the backend:

```bash
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

Run the frontend:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## The 4 Agents

### ProspectScout (Research Agent)
Scrapes a company's website using Firecrawl and extracts structured intelligence — industry, size, products, pain points, tech stack, and recent news.

### FitAnalyzer (Qualification Agent)
Scores prospect fit (0–100) across multiple dimensions using RAG against a product catalog. Generates talking points and matches case studies.

### PitchCraft (Content Agent)
Crafts a personalized outreach email (<150 words) with specific hooks, case study references, and a soft CTA. Also generates internal strategy notes for the sales rep.

### OutreachPilot (Delivery Agent)
Sends the approved email via Outlook.

## Built With

- [Airia](https://airia.com) — AI pipeline orchestration, Data Store, and tool integrations
- [FastAPI](https://fastapi.tiangolo.com/) — async Python web framework
- [Next.js](https://nextjs.org/) — React framework
- [shadcn/ui](https://ui.shadcn.com/) — UI components
- [Firecrawl](https://firecrawl.dev/) — web scraping (via Airia tool)

## License

MIT
