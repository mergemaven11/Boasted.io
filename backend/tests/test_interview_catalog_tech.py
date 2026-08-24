from app.interview_catalog_seed import build_catalog


def test_technology_roles_are_well_represented():
    titles={c['title'] for c in build_catalog()}
    assert {'Software Engineer','Platform Engineer','Cloud Architect','Cybersecurity Analyst','Mobile Developer','Salesforce Administrator'} <= titles
