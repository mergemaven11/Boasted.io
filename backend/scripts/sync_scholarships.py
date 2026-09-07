"""Production scheduler entrypoint for the licensed scholarship catalog.

Run from the backend directory:
    python scripts/sync_scholarships.py

The process exits non-zero on license drift, upstream failure, or database failure so
Render/another scheduler can alert instead of silently accepting stale or unlicensed data.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.scholarship_catalog import sync_open_scholarships  # noqa: E402


def main() -> int:
    result = sync_open_scholarships()
    print(json.dumps(result, default=str, sort_keys=True))
    return 0 if result.get("status") in {"ok", "already_running"} else 1


if __name__ == "__main__":
    raise SystemExit(main())
