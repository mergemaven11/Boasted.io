from app.interview_catalog_seed import build_catalog

def test_phase2_final_api_shape():assert all({'slug','title','family','questions'}<=set(x) for x in build_catalog())
