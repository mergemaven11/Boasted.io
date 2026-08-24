from app.interview_catalog_seed import build_catalog


def test_public_safety_roles_are_represented():
    titles={c['title'] for c in build_catalog()}
    assert {'Security Officer','Police Officer','911 Dispatcher','Firefighter','Correctional Officer','Park Ranger'} <= titles
