from app.interview_catalog_seed import build_catalog

def test_requested_growth_questions_prompt_for_skill_development():
    by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):assert 'skill' in next(q['text'] for q in by[x]['questions'] if q['category']=='growth').lower()
