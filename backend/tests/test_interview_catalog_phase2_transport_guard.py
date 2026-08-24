from app.interview_catalog_seed import build_catalog

def test_phase2_transport_career_guard():assert {'Truck Driver','Bus Driver','Delivery Driver','Flight Attendant','Railroad Conductor'}<={c['title'] for c in build_catalog()}
