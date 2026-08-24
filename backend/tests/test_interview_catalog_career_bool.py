from app.interview_catalog_seed import build_catalog

def test_career_active_flags_are_boolean():assert all(isinstance(c['active'],bool) for c in build_catalog())
