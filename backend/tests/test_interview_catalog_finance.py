from app.interview_catalog_seed import build_catalog


def test_finance_roles_are_represented():
    titles={c['title'] for c in build_catalog()}
    assert {'Accountant','Risk Analyst','Bank Teller','Personal Banker','Claims Adjuster','Fraud Analyst','Underwriter'} <= titles
