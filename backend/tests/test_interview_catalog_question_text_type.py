from app.interview_catalog_seed import build_catalog

def test_question_texts_are_strings():
    assert all(isinstance(q['text'],str) for c in build_catalog() for q in c['questions'])
