from app.interview_catalog_seed import build_catalog

def test_phase2_final_version():assert {x['catalog_version'] for x in build_catalog()}=={2}
