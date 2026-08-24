from app.interview_catalog_seed import build_catalog

def test_phase2_question_text_nonempty():assert all(q['text'] for x in build_catalog() for q in x['questions'])
