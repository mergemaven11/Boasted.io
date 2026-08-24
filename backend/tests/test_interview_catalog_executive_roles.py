from app.interview_catalog_seed import build_catalog

def test_executive_roles_are_present():
    titles={c['title'] for c in build_catalog()}
    assert {'Chief Executive Officer','Chief Operating Officer','Chief Technology Officer','Chief Financial Officer'}<=titles
