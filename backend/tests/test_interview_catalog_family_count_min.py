from app.interview_catalog_seed import build_catalog

def test_minimum_family_count():assert len({c['family'] for c in build_catalog()})>=30
