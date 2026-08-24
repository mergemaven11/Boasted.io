from app.interview_catalog_seed import build_catalog

def test_priority_slugs_are_stable():
    by={c['title']:c['slug'] for c in build_catalog()}
    assert by['Call Center Representative']=='call-center-representative'
    assert by['Risk Analyst']=='risk-analyst'
    assert by['Data Analyst']=='data-analyst'
