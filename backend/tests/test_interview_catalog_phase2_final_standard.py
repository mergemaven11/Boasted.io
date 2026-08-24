from app.interview_catalog_seed import build_catalog

def test_phase2_final_standard_mix():assert all(sum(q['difficulty']=='standard' for q in x['questions'])==9 for x in build_catalog())
