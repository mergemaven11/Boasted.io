from app.interview_catalog_seed import build_catalog

def test_phase2_public_service_guard():assert {'Teacher','Social Worker','Police Officer','Firefighter','City Clerk'}<={c['title'] for c in build_catalog()}
