from app.interview_catalog_seed import build_catalog

def test_requested_reflection_questions_prompt_for_learning():
    by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):assert 'learn' in next(q['text'] for q in by[x]['questions'] if q['category']=='reflection').lower()
