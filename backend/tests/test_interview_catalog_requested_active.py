from app.interview_catalog_seed import build_catalog

def test_requested_roles_are_active():
    by={c['title']:c for c in build_catalog()}
    assert all(by[x]['active'] for x in ('Call Center Representative','Risk Analyst','Data Analyst'))
