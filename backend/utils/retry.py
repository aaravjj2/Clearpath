"""
Generic async retry decorator for ClearPath backend.
Wraps any coroutine with exponential backoff and configurable retry conditions.
"""

import asyncio
import logging
import random
from typing import Callable, Type

logger = logging.getLogger("clearpath.retry")


def async_retry(
    max_attempts: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
    jitter: bool = True,
    retryable_exceptions: tuple[Type[Exception], ...] = (Exception,),
) -> Callable:
    """
    Decorator: retry an async function on failure with exponential backoff.

    Args:
        max_attempts: Maximum total attempts (including first try).
        base_delay: Initial delay in seconds.
        max_delay: Maximum delay cap.
        jitter: Add ±25% random jitter to avoid thundering herd.
        retryable_exceptions: Only retry on these exception types.
    """
    def decorator(fn: Callable) -> Callable:
        async def wrapper(*args, **kwargs):
            last_exc: Exception | None = None
            for attempt in range(1, max_attempts + 1):
                try:
                    return await fn(*args, **kwargs)
                except retryable_exceptions as exc:
                    last_exc = exc
                    if attempt == max_attempts:
                        logger.warning(
                            "%s: all %d attempts failed — %s",
                            fn.__name__, max_attempts, exc
                        )
                        raise
                    delay = min(base_delay * (2 ** (attempt - 1)), max_delay)
                    if jitter:
                        delay *= random.uniform(0.75, 1.25)
                    logger.info(
                        "%s: attempt %d failed (%s), retrying in %.1fs",
                        fn.__name__, attempt, exc, delay
                    )
                    await asyncio.sleep(delay)
            raise last_exc  # unreachable
        return wrapper
    return decorator
