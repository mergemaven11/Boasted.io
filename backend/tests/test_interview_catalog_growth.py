from app.interview_catalog_seed import build_catalog

def test_growth_questions_cover_skill_development():
    assert all('skill' in next(q['text'] for q in c['questions'] if q['category']=='growth').lower() for c in build_catalog())
