from app.interview_catalog_seed import build_catalog

def test_phase2_repeated_build_has_same_key_set():assert {x['slug'] for x in build_catalog()}=={x['slug'] for x in build_catalog()}
