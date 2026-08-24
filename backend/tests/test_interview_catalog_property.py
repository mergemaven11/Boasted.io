from app.interview_catalog_seed import build_catalog


def test_property_roles_are_represented():
    titles={c['title'] for c in build_catalog()}
    assert {'Real Estate Agent','Property Manager','Leasing Consultant','Appraiser','Home Inspector','Facilities Manager'} <= titles
