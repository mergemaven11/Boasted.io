from app.interview_catalog_seed import build_catalog


def test_transport_roles_are_represented():
    titles={c['title'] for c in build_catalog()}
    assert {'Truck Driver','Bus Driver','Flight Attendant','Gate Agent','Railroad Conductor','Delivery Driver'} <= titles
