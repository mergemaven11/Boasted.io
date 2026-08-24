from app.interview_catalog_seed import build_catalog

def test_phase2_final_questions():assert all(len(x['questions'])==x['question_count']==12 for x in build_catalog())
