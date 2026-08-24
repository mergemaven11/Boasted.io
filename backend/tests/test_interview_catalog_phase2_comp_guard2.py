from app.interview_catalog_seed import build_catalog

def test_phase2_question_competencies_nonempty():assert all(q['competencies'] for x in build_catalog() for q in x['questions'])
