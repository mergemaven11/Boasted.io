from app.interview_catalog_seed import build_catalog

def test_question_counts_positive():assert all(c['question_count']>0 for c in build_catalog())
