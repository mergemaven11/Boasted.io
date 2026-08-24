from app.interview_catalog_seed import build_catalog

def test_requested_roles_have_timezone_aware_timestamps():
    by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):assert by[x]['updated_at'].tzinfo is not None
