"""Environment-backed kill switches for incremental AI rollout."""
from __future__ import annotations

import os

_TRUE_VALUES = {"1", "true", "yes", "on"}


def experimental_ai_enabled() -> bool:
    """Return whether experimental AI assistance is explicitly enabled.

    The default is intentionally off so deployment of this foundation cannot
    accidentally make model-backed behavior customer-facing.
    """
    return os.getenv("BRAGSTACK_EXPERIMENTAL_AI", "false").strip().casefold() in _TRUE_VALUES
