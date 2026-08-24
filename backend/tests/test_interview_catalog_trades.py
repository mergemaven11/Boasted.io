from app.interview_catalog_seed import build_catalog


def test_trade_roles_have_broad_depth():
    titles={c['title'] for c in build_catalog()}
    assert {'Electrician','Plumber','Welder','Construction Laborer','Heavy Equipment Operator','Aircraft Mechanic','Diesel Mechanic'} <= titles
