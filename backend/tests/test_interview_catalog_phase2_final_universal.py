from app.interview_catalog_seed import build_catalog

def test_phase2_final_universal_mix():assert all(sum(q['category']!='behavioral' for q in x['questions'])==4 for x in build_catalog())
