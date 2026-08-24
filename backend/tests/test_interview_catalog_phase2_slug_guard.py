from app.interview_catalog_seed import build_catalog

def test_phase2_slug_guard():
    s=[c['slug'] for c in build_catalog()];assert len(s)==len(set(s))
