"""In-memory request telemetry helpers for Boasted operations debugging.

The bounded event buffer is intended for lightweight operational visibility and
test diagnostics. It is process-local and should not be treated as a durable
observability, audit, or security-event store.
"""

from __future__ import annotations

import secrets
import threading
from collections import deque
from datetime import datetime, timezone

from app.observability import sanitize_request_path

_MAX_EVENTS = 500
_events: deque[dict] = deque(maxlen=_MAX_EVENTS)
_lock = threading.Lock()


def new_request_id() -> str:
    """Generate a compact, URL-safe identifier for request correlation."""
    return secrets.token_urlsafe(9)


def record_request(*, request_id: str, method: str, path: str, status_code: int, duration_ms: float) -> None:
    """Record normalized, token-redacted request telemetry in the bounded process-local buffer."""
    event = {
        "request_id": request_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "method": method,
        "path": sanitize_request_path(path),
        "status_code": int(status_code),
        "duration_ms": round(float(duration_ms), 2),
    }
    with _lock:
        _events.append(event)


def recent_requests(limit: int = 100) -> list[dict]:
    """Return the newest request telemetry events in reverse chronological order."""
    bounded = max(1, min(int(limit), 200))
    with _lock:
        return list(_events)[-bounded:][::-1]


def clear_for_tests() -> None:
    """Clear all buffered request telemetry for deterministic tests."""
    with _lock:
        _events.clear()
