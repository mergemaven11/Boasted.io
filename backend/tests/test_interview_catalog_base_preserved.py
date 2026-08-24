from app.interview_catalog_seed import build_catalog

def test_phase1_requested_roles_remain_present():
    titles={c['title'] for c in build_catalog()}
    assert {'Platform Engineer','Registered Nurse','Electrician','Risk Analyst','Data Analyst'}<=titles
