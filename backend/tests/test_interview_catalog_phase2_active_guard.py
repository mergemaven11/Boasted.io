from app.interview_catalog_seed import build_catalog

def test_phase2_active_guard():assert all(c['active'] and all(q['active'] for q in c['questions']) for c in build_catalog())
