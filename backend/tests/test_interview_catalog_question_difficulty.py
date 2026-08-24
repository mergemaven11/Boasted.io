from app.interview_catalog_seed import build_catalog

def test_difficulty_values_are_known():
    assert all(q['difficulty'] in {'standard','stretch'} for c in build_catalog() for q in c['questions'])
