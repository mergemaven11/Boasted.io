from app.interview_catalog_seed import build_catalog

def test_requested_question_schema_complete():
    req={'question_id','text','category','competencies','difficulty','active'};by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):assert all(req<=set(q) for q in by[x]['questions'])
