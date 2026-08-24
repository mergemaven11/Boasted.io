from app.interview_catalog_seed import build_catalog

def test_phase2_final_category_mix():assert all(len({q['category'] for q in x['questions']})==5 for x in build_catalog())
