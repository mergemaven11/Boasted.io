from app.interview_catalog_seed import build_catalog

def test_behavioral_questions_prompt_for_personal_ownership():
    assert all('personally do' in q['text'] for c in build_catalog() for q in c['questions'] if q['category']=='behavioral')
