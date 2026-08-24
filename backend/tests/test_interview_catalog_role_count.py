from app.interview_catalog_seed import build_catalog

def test_role_count_is_substantial():
    assert len(build_catalog())>=500
