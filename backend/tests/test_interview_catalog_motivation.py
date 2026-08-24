from app.interview_catalog_seed import build_catalog

def test_motivation_questions_are_role_specific():
    assert all(c['title'] in next(q['text'] for q in c['questions'] if q['category']=='motivation') for c in build_catalog())
