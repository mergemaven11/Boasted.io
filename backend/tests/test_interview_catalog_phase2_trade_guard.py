from app.interview_catalog_seed import build_catalog

def test_phase2_trade_career_guard():assert {'Electrician','Plumber','Welder','Diesel Mechanic','Construction Laborer'}<={c['title'] for c in build_catalog()}
