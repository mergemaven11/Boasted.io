from app.interview_catalog_seed import build_catalog

def test_phase2_final_catalog_prebuilt_locally():assert sum(len(x['questions']) for x in build_catalog())>=6000
