from app.interview_catalog_seed import build_catalog

def test_phase2_preserves_phase1_roles():assert {'Registered Nurse','Platform Engineer','Electrician'}<={c['title'] for c in build_catalog()}
