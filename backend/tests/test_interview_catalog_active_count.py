from app.interview_catalog_seed import build_catalog

def test_all_seed_careers_active():assert sum(c['active'] for c in build_catalog())==len(build_catalog())
