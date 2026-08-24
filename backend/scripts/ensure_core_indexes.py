from __future__ import annotations

import os
import sys

from pymongo import MongoClient

from app.indexes import ensure_core_indexes


def main() -> int:
    mongo_url = os.getenv("MONGO_URL", "").strip()
    db_name = os.getenv("MONGO_DB_NAME", "bragstack").strip() or "bragstack"
    if not mongo_url:
        print("MONGO_URL is required.", file=sys.stderr)
        return 2

    client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
    try:
        client.admin.command("ping")
        created = ensure_core_indexes(client[db_name])
    finally:
        client.close()

    # Index names are safe operational metadata; never print MONGO_URL.
    for collection, names in created.items():
        print(f"{collection}: {', '.join(names)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
