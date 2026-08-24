from app.interview_catalog_seed import build_catalog

def test_every_generated_question_active():assert all(q['active'] for c in build_catalog() for q in c['questions'])
