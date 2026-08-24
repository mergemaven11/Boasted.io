from app.interview_catalog_seed import build_catalog

def test_aviation_roles_include_flight_and_ground_operations():
    titles={c['title'] for c in build_catalog()}
    assert {'Commercial Pilot','Flight Attendant','Aircraft Mechanic','Air Traffic Controller','Ramp Agent','Flight Dispatcher'}<=titles
