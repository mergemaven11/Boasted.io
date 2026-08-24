from app.interview_catalog_seed import build_catalog

def test_requested_roles_generated_by_local_catalog_builder():
    titles={c['title'] for c in build_catalog()};assert {'Call Center Representative','Risk Analyst','Data Analyst'}<=titles
