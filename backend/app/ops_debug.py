"""In-memory request telemetry helpers for BragStack operations debugging.

The bounded event buffer is intended for lightweight operational visibility and
test diagnostics. It is process-local and should not be treated as a durable
observability, audit, or security-event store.
"""

from __future__ import annotations

import secrets
import threading
from collections import deque
from datetime import datetime, timezone

_MAX_EVENTS = 500
_events: deque[dict] = deque(maxlen=_MAX_EVENTS)
_lock = threading.Lock()


def new_request_id() -> str:
    """Generate a compact, URL-safe identifier for request correlation.

    Returns:
        A random URL-safe token suitable for correlating logs and responses.
    """
    return secrets.token_urlsafe(9)


def record_request(*, request_id: str, method: str, path: str, status_code: int, duration_ms: float) -> None:
    """Record normalized request telemetry in the bounded process-local buffer.

    Args:
        request_id: Correlation identifier assigned to the request.
        method: HTTP method used by the request.
        path: Request path recorded for operational diagnostics.
        status_code: HTTP response status code.
        duration_ms: Request duration in milliseconds.

    Returns:
        None.

    Note:
        The buffer is capped at 500 events and protected by a lock for access
        from concurrent request threads. Entries disappear when the process
        restarts and are not a substitute for durable telemetry or audit logs.
    """
    event = {
        "request_id": request_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "method": method,
        "path": path,
        "status_code": int(status_code),
        "duration_ms": round(float(duration_ms), 2),
    }
    with _lock:
        _events.append(event)


def recent_requests(limit: int = 100) -> list[dict]:
    """Return the newest request telemetry events in reverse chronological order.

    Args:
        limit: Requested number of events. Values are clamped to the range 1 to
            200 even though the internal buffer can retain up to 500 entries.

    Returns:
        A newest-first list containing up to the bounded number of events.
    """
    bounded = max(1, min(int(limit), 200))
    with _lock:
        return list(_events)[-bounded:][::-1]


def clear_for_tests() -> None:
    """Clear all buffered request telemetry for deterministic tests.

    Returns:
        None.
    """
    with _lock:
        _events.clear()
