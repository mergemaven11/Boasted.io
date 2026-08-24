from app.interview_catalog_seed import build_catalog

def test_five_question_categories_exist():assert {q['category'] for c in build_catalog() for q in c['questions']}=={'behavioral','motivation','strength','growth','reflection'}
