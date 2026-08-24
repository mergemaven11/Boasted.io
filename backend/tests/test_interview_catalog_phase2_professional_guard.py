from app.interview_catalog_seed import build_catalog

def test_phase2_professional_career_guard():assert {'Attorney','Mechanical Engineer','Accountant','Human Resources Generalist','Data Analyst'}<={c['title'] for c in build_catalog()}
