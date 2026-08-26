from __future__ import annotations

import secrets
import threading
from collections import deque
from datetime import datetime, timezone

_MAX_EVENTS = 500
_events: deque[dict] = deque(maxlen=_MAX_EVENTS)
_lock = threading.Lock()


def new_request_id() -> str:
    return secrets.token_urlsafe(9)


def record_request(*, request_id: str, method: str, path: str, status_code: int, duration_ms: float) -> None:
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
    bounded = max(1, min(int(limit), 200))
    with _lock:
        return list(_events)[-bounded:][::-1]


def clear_for_tests() -> None:
    with _lock:
        _events.clear()
