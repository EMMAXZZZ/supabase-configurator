"""Rate limiting middleware for production security."""
from __future__ import annotations

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

# Create limiter instance
limiter = Limiter(key_func=get_remote_address)


def setup_rate_limiter(app: FastAPI) -> None:
    """Set up rate limiting for the FastAPI application.
    
    Args:
        app: FastAPI application instance
    """
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_handler)


async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """Custom rate limit handler with logging.
    
    Args:
        request: FastAPI request object
        exc: Rate limit exceeded exception
        
    Returns:
        JSONResponse: Rate limit exceeded response
    """
    client_ip = get_remote_address(request)
    logger.warning(f"Rate limit exceeded for IP: {client_ip}")
    
    return JSONResponse(
        status_code=429,
        content={
            "error": "Rate limit exceeded",
            "detail": f"Too many requests. Limit: {exc.detail}",
            "retry_after": getattr(exc, 'retry_after', 60)
        },
        headers={"Retry-After": str(getattr(exc, 'retry_after', 60))}
    )


# Rate limit decorators for different endpoint types
FORM_RATE_LIMIT = "10/minute"  # Form submissions
API_RATE_LIMIT = "30/minute"   # API endpoints
HEALTH_RATE_LIMIT = "60/minute"  # Health checks
