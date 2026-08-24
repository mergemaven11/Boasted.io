from app.interview_catalog_seed import build_catalog

def test_phase2_family_total_invariant():assert len({x['family'] for x in build_catalog()})>=30
