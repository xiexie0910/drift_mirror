import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from contextlib import asynccontextmanager

from app.db import init_db
from app.routes import resolutions, checkins, dashboard, demo, reality_check

# Environment configuration
IS_PRODUCTION = os.getenv("ENVIRONMENT", "development") == "production"
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="DriftMirror API",
    lifespan=lifespan,
    # Disable docs in production
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
)

# Security: Trusted Host middleware (prevents host header attacks)
if IS_PRODUCTION:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=["localhost", "127.0.0.1"],
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(resolutions.router, prefix="/api/resolutions", tags=["resolutions"])
app.include_router(checkins.router, prefix="/api/checkins", tags=["checkins"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(demo.router, prefix="/api/demo", tags=["demo"])
app.include_router(reality_check.router, prefix="/api/reality-check", tags=["reality-check"])

@app.get("/api/health")
async def health():
    return {"status": "ok"}
