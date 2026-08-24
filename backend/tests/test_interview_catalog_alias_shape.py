from app.interview_catalog_seed import build_catalog

def test_alias_defaults_are_empty_lists():
    assert all(c['aliases']==[] for c in build_catalog())
