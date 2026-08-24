from app.interview_catalog_seed import build_catalog

def test_phase2_final_mongo_keys():
    s=[x['slug'] for x in build_catalog()];assert all(s) and len(s)==len(set(s))
