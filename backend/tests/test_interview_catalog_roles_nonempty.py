from app.interview_catalog_seed import build_catalog

def test_all_role_names_are_nonempty():
    assert all(c['title'].strip() for c in build_catalog())
