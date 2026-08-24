from app.interview_catalog_seed import build_catalog

def test_phase2_final_timestamps():assert all(x['updated_at'].tzinfo is not None for x in build_catalog())
