from app.interview_catalog_seed import build_catalog

def test_requested_roles_each_have_twelve_questions():
    by={c['title']:c for c in build_catalog()}
    assert all(len(by[x]['questions'])==12 for x in ('Call Center Representative','Risk Analyst','Data Analyst'))
