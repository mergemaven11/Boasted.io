from app.interview_catalog_seed import build_catalog

def test_phase2_category_guard():assert all({q['category'] for q in c['questions']}=={'behavioral','motivation','strength','growth','reflection'} for c in build_catalog())
