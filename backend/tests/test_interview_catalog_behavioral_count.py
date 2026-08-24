from app.interview_catalog_seed import build_catalog

def test_behavioral_question_count_is_eight():assert all(sum(q['category']=='behavioral' for q in c['questions'])==8 for c in build_catalog())
