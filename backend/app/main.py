from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import approvals, deals, events, pipeline, prospects


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(
    title="DealFlow API",
    description="Intelligent multi-agent sales pipeline accelerator",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(prospects.router, prefix="/api")
app.include_router(deals.router, prefix="/api")
app.include_router(approvals.router, prefix="/api")
app.include_router(pipeline.router, prefix="/api")
app.include_router(events.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "dealflow"}
