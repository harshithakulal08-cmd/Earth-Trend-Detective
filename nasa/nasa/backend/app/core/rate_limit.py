import time
from collections import defaultdict
from typing import Dict, List
from fastapi import Request, HTTPException, status
from app.core.config import settings

# In-memory sliding window rate limiter
_request_timestamps: Dict[str, List[float]] = defaultdict(list)

def check_rate_limit(request: Request):
    """
    Check if the requesting client IP has exceeded the allowed request threshold.
    Returns normally if under limit; raises HTTP 429 if exceeded.
    """
    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    window = 60.0  # 60 seconds
    limit = settings.RATE_LIMIT_PER_MINUTE

    # Clean timestamps older than 60 seconds
    timestamps = _request_timestamps[client_ip]
    _request_timestamps[client_ip] = [t for t in timestamps if now - t < window]

    if len(_request_timestamps[client_ip]) >= limit:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please wait a minute before sending more requests.",
            headers={"Retry-After": "60"}
        )

    _request_timestamps[client_ip].append(now)

