from app.interview_catalog_seed import build_catalog

def test_phase2_question_difficulty_known():assert all(q['difficulty'] in ('standard','stretch') for x in build_catalog() for q in x['questions'])
