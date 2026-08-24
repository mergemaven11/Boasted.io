from app.interview_catalog_seed import build_catalog

def test_families_are_strings():assert all(isinstance(c['family'],str) for c in build_catalog())
