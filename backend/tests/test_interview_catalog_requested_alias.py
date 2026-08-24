from app.interview_catalog_seed import build_catalog

def test_requested_roles_aliases_are_lists():
    by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):assert isinstance(by[x]['aliases'],list)
