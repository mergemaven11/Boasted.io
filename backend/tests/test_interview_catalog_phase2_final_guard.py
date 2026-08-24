from app.interview_catalog_seed import build_catalog

def test_phase2_final_invariant():
    c=build_catalog();assert len(c)>=500 and all(len(x['questions'])==12 for x in c)
