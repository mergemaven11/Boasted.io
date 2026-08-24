from app.interview_catalog_seed import build_catalog

def test_family_identifiers_are_lowercase():assert all(c['family']==c['family'].lower() for c in build_catalog())
