from app.interview_catalog_seed import build_catalog

def test_data_governance_roles_are_present():
    titles={c['title'] for c in build_catalog()}
    assert {'Database Administrator','Data Governance Analyst','Data Quality Analyst','Master Data Analyst','Reporting Analyst'}<=titles
