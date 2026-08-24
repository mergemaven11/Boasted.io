from app.interview_catalog_seed import build_catalog

def test_phase2_final_active():assert all(x['active'] for x in build_catalog())
