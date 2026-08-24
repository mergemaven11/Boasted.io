from app.interview_catalog_seed import build_catalog

def test_competencies_are_lists():
    assert all(isinstance(q['competencies'],list) for c in build_catalog() for q in c['questions'])
