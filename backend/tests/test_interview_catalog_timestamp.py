from datetime import datetime
from app.interview_catalog_seed import build_catalog


def test_seed_documents_have_timestamps():
    assert all(isinstance(c['updated_at'],datetime) for c in build_catalog())
