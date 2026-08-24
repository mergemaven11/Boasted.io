from app.interview_catalog_seed import build_catalog

def test_phase2_executive_guard():assert {'Chief Executive Officer','Chief Operating Officer','Chief Technology Officer'}<={c['title'] for c in build_catalog()}
