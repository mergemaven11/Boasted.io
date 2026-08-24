from app.interview_catalog_seed import build_catalog

def test_phase2_priority_guard():assert {'Call Center Representative','Risk Analyst','Data Analyst'}<={x['title'] for x in build_catalog()}
