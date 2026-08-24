from app.interview_catalog_seed import build_catalog

def test_family_count_broad():assert len({c['family'] for c in build_catalog()})>=30
