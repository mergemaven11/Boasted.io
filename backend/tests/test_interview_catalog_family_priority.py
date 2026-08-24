from app.interview_catalog_seed import build_catalog

def test_requested_careers_map_to_expected_families():
    by={c['title']:c['family'] for c in build_catalog()}
    assert by['Call Center Representative']=='customer-contact-center'
    assert by['Risk Analyst']=='business-finance'
    assert by['Data Analyst']=='data-ai'
