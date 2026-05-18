"""
ClearPath API — FastAPI application entry point.
"""

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from middleware.logging import StructuredLoggingMiddleware
from middleware.rate_limit import RateLimitMiddleware
from middleware.request_id import RequestIDMiddleware
from middleware.security_headers import SecurityHeadersMiddleware
from routers import chat, completions, documents, provider_mgmt

load_dotenv()

app = FastAPI(
    title="ClearPath API",
    version="1.1.0",
    description="AI-powered legal document analysis — plain English, risk scoring, red flags.",
    contact={"name": "ClearPath", "url": "https://github.com/clearpath"},
)

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_rate_limit = int(os.getenv("RATE_LIMIT_RPM", "60"))
app.add_middleware(RateLimitMiddleware, max_requests=_rate_limit, window_seconds=60)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(StructuredLoggingMiddleware)
app.add_middleware(SecurityHeadersMiddleware)

app.include_router(documents.router)
app.include_router(chat.router)
app.include_router(provider_mgmt.router)
app.include_router(completions.router)


@app.get("/health", tags=["health"])
def health():
    """Lightweight liveness probe — no dependencies checked."""
    return {"status": "ok", "service": "ClearPath API"}


@app.get("/health/detailed", tags=["health"])
def health_detailed():
    """Extended health check: version, environment, AI provider availability, cache stats."""
    from services.cache import get_clause_cache
    from services.providers import get_registry

    registry = get_registry()
    providers = registry.get_available_providers()
    cache_stats = get_clause_cache().stats

    return {
        "status": "ok",
        "service": "ClearPath API",
        "version": "1.1.0",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "rate_limit_rpm": _rate_limit,
        "providers": providers,
        "cache": cache_stats,
    }
