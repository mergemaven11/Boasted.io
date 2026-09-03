"""Send privacy-safe, best-effort BragStack lifecycle analytics.

Analytics must never become part of the product's correctness path. Events are
allow-listed here, contain no user-authored career content, and are delivered
asynchronously only when a PostHog project key is configured.
"""

from __future__ import annotations

import logging
import os
from threading import Thread

import httpx

logger = logging.getLogger(__name__)

EVENT_USER_SIGNED_UP = "user_signed_up"
EVENT_BRAG_CREATED = "brag_created"
EVENT_IMPACT_RECEIPT_CREATED = "impact_receipt_created"
EVENT_PLAN_UPGRADED = "plan_upgraded"

_ALLOWED_EVENTS = {
    EVENT_USER_SIGNED_UP,
    EVENT_BRAG_CREATED,
    EVENT_IMPACT_RECEIPT_CREATED,
    EVENT_PLAN_UPGRADED,
}
_ALLOWED_PROPERTIES = {
    "source",
    "current_plan",
    "brag_id",
    "impact_receipt_id",
    "source_brag_id",
    "is_public",
    "schema_version",
    "stripe_event_id",
    "stripe_event_type",
    "subscription_id",
}


def _posthog_config() -> tuple[str, str]:
    """Return the configured PostHog project key and normalized host."""
    key = os.getenv("POSTHOG_PROJECT_API_KEY", "").strip()
    host = os.getenv("POSTHOG_HOST", "https://us.i.posthog.com").strip().rstrip("/")
    return key, host


def _safe_properties(properties: dict) -> dict:
    """Return only explicitly approved primitive analytics properties."""
    safe: dict = {}
    for key, value in properties.items():
        if key not in _ALLOWED_PROPERTIES or value is None:
            continue
        if isinstance(value, (str, int, float, bool)):
            safe[key] = value
    return safe


def _deliver_event(project_key: str, host: str, distinct_id: str, event: str, properties: dict) -> None:
    """Deliver one analytics event without propagating transport failures."""
    try:
        httpx.post(
            f"{host}/capture/",
            json={
                "api_key": project_key,
                "event": event,
                "properties": {"distinct_id": str(distinct_id), **properties},
            },
            timeout=2.0,
        )
    except Exception:
        logger.warning("PostHog capture failed for %s", event, exc_info=True)


def capture_product_event(distinct_id: str, event: str, **properties) -> None:
    """Queue one allow-listed lifecycle event without blocking product work."""
    project_key, host = _posthog_config()
    if not project_key or event not in _ALLOWED_EVENTS or not distinct_id:
        return

    safe = _safe_properties(properties)
    Thread(
        target=_deliver_event,
        args=(project_key, host, str(distinct_id), event, safe),
        daemon=True,
        name=f"bragstack-analytics-{event}",
    ).start()
