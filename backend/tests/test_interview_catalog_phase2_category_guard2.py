from app.interview_catalog_seed import build_catalog

def test_phase2_question_categories_known():assert all(q['category'] in {'behavioral','motivation','strength','growth','reflection'} for x in build_catalog() for q in x['questions'])
