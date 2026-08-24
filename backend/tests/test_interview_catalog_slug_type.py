from app.interview_catalog_seed import build_catalog

def test_slugs_are_strings():assert all(isinstance(c['slug'],str) for c in build_catalog())
