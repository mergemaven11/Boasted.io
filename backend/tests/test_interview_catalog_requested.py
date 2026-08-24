from app.interview_catalog_seed import build_catalog


def test_user_requested_careers_are_first_class_catalog_entries():
    by={c['title']:c for c in build_catalog()}
    assert by['Call Center Representative']['family']=='customer-contact-center'
    assert by['Risk Analyst']['family']=='business-finance'
    assert by['Data Analyst']['family']=='data-ai'
