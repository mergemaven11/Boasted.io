"""Daily maintenance entrypoint for scholarship expiration.

Run from the backend directory:
    python scripts/expire_scholarships.py

Expired scholarship cycles are soft-expired, not deleted, so provenance and history
remain available for audit and future recurring-cycle reconciliation.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.scholarship_catalog import archive_expired_scholarships, utcnow  # noqa: E402


def main() -> int:
    started_at = utcnow()
    expired = archive_expired_scholarships(now=started_at)
    print(json.dumps({"status": "ok", "expired": expired, "ran_at": started_at.isoformat()}, sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
