from app.interview_catalog_seed import build_catalog

def test_question_text_minimum_length():assert min(len(q['text']) for c in build_catalog() for q in c['questions'])>30
