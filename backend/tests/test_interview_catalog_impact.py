from app.interview_catalog_seed import build_catalog

def test_behavioral_questions_prompt_for_results():
    assert all('changed as a result' in q['text'] for c in build_catalog() for q in c['questions'] if q['category']=='behavioral')
