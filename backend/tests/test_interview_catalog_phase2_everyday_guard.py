from app.interview_catalog_seed import build_catalog

def test_phase2_everyday_career_guard():assert {'Cashier','Warehouse Associate','Call Center Representative','Restaurant Server','Administrative Assistant'}<={c['title'] for c in build_catalog()}
