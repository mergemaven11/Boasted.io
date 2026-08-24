from app.interview_catalog_seed import build_catalog


def test_long_tail_roles_are_represented():
    titles={c['title'] for c in build_catalog()}
    assert {'Funeral Director','Postal Service Clerk','Mail Carrier','Pet Groomer','Florist','Tour Guide','Travel Agent'} <= titles
