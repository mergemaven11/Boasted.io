from app.interview_catalog_seed import build_catalog

def test_driver_roles_are_present():
    titles={c['title'] for c in build_catalog()}
    assert {'Truck Driver','CDL Driver','Bus Driver','School Bus Driver','Delivery Driver','Courier'}<=titles
