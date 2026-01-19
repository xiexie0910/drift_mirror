from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.db import init_db
from app.routes import resolutions, checkins, dashboard, demo, reality_check

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(title="DriftMirror API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resolutions.router, prefix="/api/resolutions", tags=["resolutions"])
app.include_router(checkins.router, prefix="/api/checkins", tags=["checkins"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(demo.router, prefix="/api/demo", tags=["demo"])
app.include_router(reality_check.router, prefix="/api/reality-check", tags=["reality-check"])

@app.get("/api/health")
async def health():
    return {"status": "ok"}
