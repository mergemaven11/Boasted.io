from app.interview_catalog_seed import build_catalog

def test_phase2_final_question_schema():
    r={'question_id','text','category','competencies','difficulty','active'};assert all(r<=set(q) for x in build_catalog() for q in x['questions'])
