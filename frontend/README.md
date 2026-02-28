# DealFlow Frontend

Next.js dashboard for the DealFlow multi-agent sales pipeline. Provides real-time visibility into prospect research, deal qualification, outreach approvals, and pipeline status.

## Tech Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4** + **shadcn/ui** for components
- **SWR** for data fetching with background revalidation
- **EventSource** for real-time SSE updates

## Pages

| Page | Path | Description |
|------|------|-------------|
| Prospects | `/prospects` | View researched companies, trigger new research |
| Deals | `/deals` | Qualified prospects with fit scores and analysis |
| Approvals | `/approvals` | Review and approve/reject outreach drafts |
| Pipeline | `/pipeline` | Live pipeline run status and step details |

## Setup

```bash
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

## Development

```bash
npm run dev
```

Opens at [http://localhost:3000](http://localhost:3000). Requires the backend running on port 8000.

## Build

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with sidebar
│   ├── page.tsx                # Redirects to /prospects
│   ├── globals.css
│   ├── prospects/page.tsx
│   ├── deals/page.tsx
│   ├── approvals/page.tsx
│   └── pipeline/page.tsx
├── components/
│   ├── layout/                 # Sidebar, header
│   ├── prospects/              # Prospect table, new prospect dialog
│   ├── deals/                  # Deal card, fit score badge
│   ├── approvals/              # Draft editor, approval actions
│   ├── pipeline/               # Run timeline
│   └── ui/                     # shadcn/ui primitives
└── lib/
    ├── api.ts                  # Typed API client
    ├── sse.ts                  # Global SSE connection hook
    ├── types.ts                # TypeScript interfaces
    └── utils.ts                # Utility functions
```
