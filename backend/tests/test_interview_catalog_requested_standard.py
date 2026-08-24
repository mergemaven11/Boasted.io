from app.interview_catalog_seed import build_catalog

def test_requested_roles_have_nine_standard_questions():
    by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):assert sum(q['difficulty']=='standard' for q in by[x]['questions'])==9
