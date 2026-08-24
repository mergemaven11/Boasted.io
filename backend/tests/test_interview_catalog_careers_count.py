from app.interview_catalog_seed import build_catalog

def test_total_careers_at_least_five_hundred():assert len(build_catalog())>=500
