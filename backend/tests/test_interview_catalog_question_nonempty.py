from app.interview_catalog_seed import build_catalog

def test_all_question_text_is_nonempty():
    assert all(q['text'].strip() for c in build_catalog() for q in c['questions'])
