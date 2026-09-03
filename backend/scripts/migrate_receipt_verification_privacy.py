"""Document this first-party Python module."""
from __future__ import annotations

import json

from app.database import db
from app.verification_data_migration import migrate_receipt_verification_privacy


if __name__ == "__main__":
    result = migrate_receipt_verification_privacy(db)
    print(json.dumps(result, sort_keys=True))
