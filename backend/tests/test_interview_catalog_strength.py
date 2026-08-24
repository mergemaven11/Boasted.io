from app.interview_catalog_seed import build_catalog

def test_strength_questions_ask_for_evidence():
    assert all('evidence' in next(q['text'] for q in c['questions'] if q['category']=='strength').lower() for c in build_catalog())
