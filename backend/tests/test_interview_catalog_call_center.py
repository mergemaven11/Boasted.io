from app.interview_catalog_seed import build_catalog


def test_call_center_family_has_multiple_real_world_roles():
    roles=[c for c in build_catalog() if c['family']=='customer-contact-center']
    assert len(roles)>=20
    assert any(c['title']=='Call Center Representative' for c in roles)
