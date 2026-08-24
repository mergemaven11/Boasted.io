from app.interview_catalog_seed import build_catalog

def test_phase2_final_unique():
    s=[x['slug'] for x in build_catalog()];assert len(s)==len(set(s))
