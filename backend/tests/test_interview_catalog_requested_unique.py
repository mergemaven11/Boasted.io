from app.interview_catalog_seed import build_catalog

def test_requested_roles_not_duplicated():
    titles=[c['title'] for c in build_catalog()]
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):assert titles.count(x)==1
