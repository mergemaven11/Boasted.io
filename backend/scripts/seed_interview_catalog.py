"""Document this first-party Python module."""
from pathlib import Path
import sys

from pymongo import ASCENDING, ReplaceOne

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

from app.database import interview_careers_collection
from app.interview_catalog_seed import build_catalog


def seed_interview_catalog() -> dict:
    """Handle seed interview catalog.

    Returns:
        Function result.
    """
    documents = build_catalog()
    interview_careers_collection.create_index([("slug", ASCENDING)], unique=True, name="uniq_interview_career_slug")
    interview_careers_collection.create_index([("family", ASCENDING), ("active", ASCENDING)], name="interview_career_family_active")
    interview_careers_collection.create_index([("title", ASCENDING)], name="interview_career_title")

    operations = [
        ReplaceOne({"slug": document["slug"]}, document, upsert=True)
        for document in documents
    ]
    result = interview_careers_collection.bulk_write(operations, ordered=False)
    return {
        "careers": len(documents),
        "questions": sum(document["question_count"] for document in documents),
        "matched": result.matched_count,
        "modified": result.modified_count,
        "upserted": result.upserted_count,
    }


if __name__ == "__main__":
    stats = seed_interview_catalog()
    print(
        "Interview catalog ready: "
        f"{stats['careers']} careers / {stats['questions']} questions "
        f"({stats['upserted']} inserted, {stats['modified']} updated)."
    )
