from app.interview_catalog_seed import build_catalog


def test_frontline_roles_are_not_left_out():
    titles={x['title'] for x in build_catalog()}
    expected={'Call Center Representative','Call Center Supervisor','Cashier','Warehouse Associate','Forklift Operator','Food Service Worker','Custodian','Delivery Driver','Security Officer','Medical Receptionist'}
    assert expected <= titles
