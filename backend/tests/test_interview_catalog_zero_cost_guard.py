from app.interview_catalog_seed import build_catalog

def test_phase2_catalog_is_available_without_runtime_model_generation():assert len(build_catalog())>=500
