from app.interview_catalog_seed import build_catalog

def test_active_flags_are_boolean():assert all(isinstance(q['active'],bool) for c in build_catalog() for q in c['questions'])
