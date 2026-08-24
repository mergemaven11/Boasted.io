from app.interview_catalog_seed import build_catalog

def test_universal_question_count_is_four():assert all(sum(q['category']!='behavioral' for q in c['questions'])==4 for c in build_catalog())
