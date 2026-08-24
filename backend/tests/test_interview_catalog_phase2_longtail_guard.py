from app.interview_catalog_seed import build_catalog

def test_phase2_longtail_guard():assert {'Funeral Director','Pet Groomer','Florist','Tour Guide','Postal Service Clerk'}<={c['title'] for c in build_catalog()}
