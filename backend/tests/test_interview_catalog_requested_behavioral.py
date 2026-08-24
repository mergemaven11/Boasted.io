from app.interview_catalog_seed import build_catalog

def test_requested_roles_have_eight_behavioral_questions():
    by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):assert sum(q['category']=='behavioral' for q in by[x]['questions'])==8
