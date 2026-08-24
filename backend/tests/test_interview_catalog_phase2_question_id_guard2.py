from app.interview_catalog_seed import build_catalog

def test_phase2_question_ids_nonempty():assert all(q['question_id'] for x in build_catalog() for q in x['questions'])
