"""
Structured JSON request logging middleware for ClearPath.

Logs every request/response as a single JSON line to make logs
machine-parseable and easy to query.
"""

import json
import logging
import time
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("clearpath.access")


class StructuredLoggingMiddleware(BaseHTTPMiddleware):
    """Emit one JSON log line per HTTP request."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        start = time.perf_counter()
        request_id = getattr(request.state, "request_id", "-")

        response = await call_next(request)

        elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
        record = {
            "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status": response.status_code,
            "duration_ms": elapsed_ms,
            "ip": (
                request.headers.get("X-Forwarded-For", "").split(",")[0].strip()
                or (request.client.host if request.client else "-")
            ),
        }
        logger.info(json.dumps(record))
        return response
