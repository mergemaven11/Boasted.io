from app.interview_catalog_seed import build_catalog

def test_requested_role_slugs():
    by={c['title']:c['slug'] for c in build_catalog()}
    assert by['Call Center Representative']=='call-center-representative' and by['Risk Analyst']=='risk-analyst' and by['Data Analyst']=='data-analyst'
