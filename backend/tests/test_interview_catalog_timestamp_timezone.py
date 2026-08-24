from app.interview_catalog_seed import build_catalog

def test_timestamps_are_timezone_aware():
    assert all(c['updated_at'].tzinfo is not None for c in build_catalog())
