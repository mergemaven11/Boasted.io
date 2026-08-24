from app.interview_catalog_seed import build_catalog

def test_requested_role_motivation_prompts_name_role():
    by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):assert x in next(q['text'] for q in by[x]['questions'] if q['category']=='motivation')
