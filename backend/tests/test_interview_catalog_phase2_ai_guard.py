from app.interview_catalog_seed import build_catalog

def test_phase2_catalog_builder_requires_no_model_client():assert build_catalog()[0]['questions']
