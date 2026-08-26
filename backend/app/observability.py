from __future__ import annotations

import hashlib
import os
import threading
from datetime import datetime, timezone

from pymongo.errors import PyMongoError

from app.database import ops_events_collection

_RETENTION_SECONDS = 14 * 24 * 60 * 60
_index_lock = threading.Lock()
_indexes_ready = False


def _ensure_indexes() -> None:
    global _indexes_ready
    if _indexes_ready:
        return
    with _index_lock:
        if _indexes_ready:
            return
        try:
            ops_events_collection.create_index("created_at", expireAfterSeconds=_RETENTION_SECONDS)
            ops_events_collection.create_index([("created_at", -1), ("status_code", 1)])
            ops_events_collection.create_index([("error_fingerprint", 1), ("created_at", -1)])
        except PyMongoError:
            return
        _indexes_ready = True


def _fingerprint(*, method: str, path: str, error_type: str | None) -> str | None:
    if not error_type:
        return None
    material = f"{method.upper()}:{path}:{error_type}".encode("utf-8")
    return hashlib.sha256(material).hexdigest()[:16]


def record_persistent_request(
    *,
    request_id: str,
    method: str,
    path: str,
    status_code: int,
    duration_ms: float,
    error_type: str | None = None,
) -> None:
    """Persist only sanitized operational metadata. Never request bodies, headers, tokens, or query strings."""
    try:
        _ensure_indexes()
        ops_events_collection.insert_one(
            {
                "created_at": datetime.now(timezone.utc),
                "request_id": request_id,
                "method": method.upper(),
                "path": path,
                "status_code": int(status_code),
                "duration_ms": round(float(duration_ms), 2),
                "error_type": error_type,
                "error_fingerprint": _fingerprint(method=method, path=path, error_type=error_type),
                "service": os.getenv("RENDER_SERVICE_NAME", "bragstack-api"),
                "environment": os.getenv("APP_ENV") or ("production" if os.getenv("RENDER") else "local"),
                "version": os.getenv("RENDER_GIT_COMMIT", "local")[:12],
            }
        )
    except PyMongoError:
        # Observability must never take down customer traffic.
        return
