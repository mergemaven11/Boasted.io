from app.interview_catalog_seed import build_catalog


def test_manufacturing_roles_are_represented():
    titles={c['title'] for c in build_catalog()}
    assert {'Production Worker','Machine Operator','CNC Operator','Quality Inspector','Production Supervisor','Plant Manager'} <= titles
