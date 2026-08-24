from app.interview_catalog_seed import build_catalog

def test_family_identifiers_have_no_spaces():assert all(' ' not in c['family'] for c in build_catalog())
