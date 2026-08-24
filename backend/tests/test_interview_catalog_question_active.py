from app.interview_catalog_seed import build_catalog

def test_all_questions_are_enabled():
    assert all(q['active'] for c in build_catalog() for q in c['questions'])
