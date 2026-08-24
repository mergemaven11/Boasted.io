from app.interview_catalog_seed import build_catalog

def test_phase2_final_stretch_mix():assert all(sum(q['difficulty']=='stretch' for q in x['questions'])==3 for x in build_catalog())
