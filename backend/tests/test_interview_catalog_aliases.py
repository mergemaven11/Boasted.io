from app.interview_catalog_seed import build_catalog

def test_aliases_are_lists_for_future_search_expansion():
    assert all(isinstance(c['aliases'],list) for c in build_catalog())
