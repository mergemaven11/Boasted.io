from app.interview_catalog_seed import build_catalog

def test_phase2_seed_has_unique_replaceone_keys():
    s=[c['slug'] for c in build_catalog()];assert len(s)==len(set(s))
