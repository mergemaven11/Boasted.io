from app.interview_catalog_seed import build_catalog

def test_reflection_questions_cover_learning():
    assert all('learn' in next(q['text'] for q in c['questions'] if q['category']=='reflection').lower() for c in build_catalog())
