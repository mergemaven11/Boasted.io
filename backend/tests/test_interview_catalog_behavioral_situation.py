from app.interview_catalog_seed import build_catalog

def test_behavioral_questions_request_situation():assert all('situation' in q['text'].lower() for c in build_catalog() for q in c['questions'] if q['category']=='behavioral')
