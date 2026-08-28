"""Privacy-safe, best-effort product analytics.

Product behavior must never fail because analytics is unavailable. The PostHog
client batches delivery in the background, while this module keeps the event
contract and allowed properties in one reviewable place.
"""

from functools import lru_cache
import logging
import os


logger = logging.getLogger(__name__)

EVENT_USER_SIGNED_UP = "user_signed_up"
EVENT_BRAG_CREATED = "brag_created"
EVENT_IMPACT_RECEIPT_CREATED = "impact_receipt_created"
EVENT_PLAN_UPGRADED = "plan_upgraded"

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


@lru_cache(maxsize=1)
def _client():
    api_key = os.getenv("POSTHOG_PROJECT_API_KEY", "").strip()
    if not api_key:
        return None

    from posthog import Posthog

    return Posthog(
        api_key,
        host=os.getenv("POSTHOG_HOST", "https://us.i.posthog.com").rstrip("/"),
    )


def capture_product_event(distinct_id: str, event: str, **properties) -> None:
    """Queue an allow-listed lifecycle event without affecting the request."""
    client = _client()
    if client is None:
        return

    safe_properties = {
        key: value
        for key, value in properties.items()
        if key in _ALLOWED_PROPERTIES and value is not None
    }
    try:
        client.capture(
            event,
            distinct_id=str(distinct_id),
            properties=safe_properties,
        )
    except Exception:
        logger.warning("PostHog capture failed for %s", event, exc_info=True)
