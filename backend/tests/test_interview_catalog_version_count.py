from app.interview_catalog_seed import build_catalog

def test_all_expanded_careers_are_v2():
    assert {c['catalog_version'] for c in build_catalog()}=={2}
