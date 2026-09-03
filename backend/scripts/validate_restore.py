"""Document this first-party Python module."""
from __future__ import annotations

import json
import os
import sys

from pymongo import MongoClient

from app.restore_validation import validate_restored_database


def main() -> int:
    """Handle main.

    Returns:
        Function result.
    """
    if os.getenv("RESTORE_DRILL_CONFIRM_ISOLATED", "").lower() != "true":
        print(
            "Refusing to run: set RESTORE_DRILL_CONFIRM_ISOLATED=true only for an isolated non-production restore target.",
            file=sys.stderr,
        )
        return 2

    restore_url = os.getenv("RESTORE_MONGO_URL", "").strip()
    db_name = os.getenv("RESTORE_DB_NAME", "bragstack").strip() or "bragstack"
    production_url = os.getenv("MONGO_URL", "").strip()

    if not restore_url:
        print("RESTORE_MONGO_URL is required.", file=sys.stderr)
        return 2

    if production_url and restore_url == production_url:
        print(
            "Refusing to validate: restore target matches MONGO_URL. Never run a restore drill against production.",
            file=sys.stderr,
        )
        return 2

    client = MongoClient(restore_url, serverSelectionTimeoutMS=5000)
    try:
        client.admin.command("ping")
        result = validate_restored_database(client[db_name])
    finally:
        client.close()

    print(
        json.dumps(
            {
                "passed": result.passed,
                "checks": result.checks,
                "counts": result.counts,
                "errors": result.errors,
            },
            indent=2,
            sort_keys=True,
        )
    )
    return 0 if result.passed else 1


if __name__ == "__main__":
    raise SystemExit(main())
