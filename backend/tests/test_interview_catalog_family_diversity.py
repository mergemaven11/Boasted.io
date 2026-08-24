from app.interview_catalog_seed import build_catalog

def test_catalog_has_broad_family_diversity():
    assert len({c['family'] for c in build_catalog()})>=30
