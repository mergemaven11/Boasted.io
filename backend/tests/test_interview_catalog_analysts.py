from app.interview_catalog_seed import build_catalog


def test_analyst_roles_include_requested_specialties():
    titles={c['title'] for c in build_catalog()}
    assert {'Risk Analyst','Data Analyst','Fraud Analyst','Credit Analyst','AML Analyst','KYC Analyst','Pricing Analyst','Revenue Analyst'} <= titles
