from app.interview_catalog_seed import build_catalog

def test_manager_roles_are_present():
    titles={c['title'] for c in build_catalog()}
    assert {'Store Manager','Warehouse Manager','Restaurant Manager','Hotel Manager','Human Resources Manager'}<=titles
