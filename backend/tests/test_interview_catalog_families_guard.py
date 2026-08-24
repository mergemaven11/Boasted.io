from app.interview_catalog_seed import build_catalog

def test_phase2_final_family_guard():assert len({x['family'] for x in build_catalog()})>=30
