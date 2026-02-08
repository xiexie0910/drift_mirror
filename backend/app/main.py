import os
import time
import logging
from collections import defaultdict
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from contextlib import asynccontextmanager

from app.db import init_db
from app.routes import resolutions, checkins, dashboard, reality_check, demo

logger = logging.getLogger(__name__)

# Environment configuration
IS_PRODUCTION = os.getenv("ENVIRONMENT", "development") == "production"
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
ALLOWED_HOSTS = os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")


# ============================================================
# Rate Limiter (in-memory, no external dependency)
# ============================================================

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Simple sliding-window rate limiter.
    LLM-hitting endpoints get a tighter budget to prevent abuse.
    """

    # Endpoints that call the LLM (tighter limit)
    LLM_PATHS = {"/api/reality-check/assess/", "/api/reality-check/generate-options/", "/api/dashboard"}

    def __init__(self, app, default_rpm: int = 60, llm_rpm: int = 15):
        super().__init__(app)
        self.default_rpm = default_rpm
        self.llm_rpm = llm_rpm
        self._hits: dict[str, list[float]] = defaultdict(list)

    def _is_llm_path(self, path: str) -> bool:
        return any(path.startswith(p) for p in self.LLM_PATHS)

    def _clean(self, key: str, now: float):
        """Remove entries older than 60 s."""
        self._hits[key] = [t for t in self._hits[key] if now - t < 60]

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        path = request.url.path
        key = f"{client_ip}:{path}"
        now = time.time()
        self._clean(key, now)

        limit = self.llm_rpm if self._is_llm_path(path) else self.default_rpm
        if len(self._hits[key]) >= limit:
            logger.warning(f"Rate limit hit: {key} ({len(self._hits[key])} reqs/min)")
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again in a minute."},
            )

        self._hits[key].append(now)
        return await call_next(request)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        # Prevent XSS attacks
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        # Referrer policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # Content Security Policy (API only, so restrictive)
        if IS_PRODUCTION:
            response.headers["Content-Security-Policy"] = "default-src 'none'; frame-ancestors 'none'"
        return response

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Configure structured logging
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    init_db()
    logger.info("DriftMirror API started (env=%s)", "production" if IS_PRODUCTION else "development")
    yield

app = FastAPI(
    title="DriftMirror API",
    lifespan=lifespan,
    # Disable docs in production
    docs_url=None if IS_PRODUCTION else "/docs",
    redoc_url=None if IS_PRODUCTION else "/redoc",
    openapi_url=None if IS_PRODUCTION else "/openapi.json",
    # Prevent automatic trailing slash redirects
    redirect_slashes=False,
)

# Security: Trusted Host middleware (prevents host header attacks)
if IS_PRODUCTION:
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=ALLOWED_HOSTS,
    )

# Security: Add security headers to all responses
app.add_middleware(SecurityHeadersMiddleware)

# Rate limiting: protect LLM endpoints from abuse
app.add_middleware(RateLimitMiddleware, default_rpm=60, llm_rpm=15)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(resolutions.router, prefix="/api/resolutions", tags=["resolutions"])
app.include_router(checkins.router, prefix="/api/checkins", tags=["checkins"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(reality_check.router, prefix="/api/reality-check", tags=["reality-check"])
app.include_router(demo.router, prefix="/api/demo", tags=["demo"])

@app.get("/api/health")
async def health():
    """Basic liveness check."""
    return {"status": "ok"}


@app.get("/api/health/llm")
async def health_llm():
    """Verify LLM connectivity — useful before a live demo."""
    try:
        from app.services.llm_client import call_llm
        response = await call_llm("Reply with exactly: pong", "You are a health-check bot.")
        return {"status": "ok", "llm": "connected", "sample": response[:40]}
    except Exception as e:
        logger.error(f"LLM health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={"status": "degraded", "llm": "unavailable", "error": str(e)},
        )
