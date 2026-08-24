from app.interview_catalog_seed import build_catalog

def test_no_empty_competencies():assert all(len(q['competencies'])>=3 for c in build_catalog() for q in c['questions'])
