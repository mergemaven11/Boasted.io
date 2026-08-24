from app.interview_catalog_seed import build_catalog

def test_question_counts_are_ints():assert all(isinstance(c['question_count'],int) for c in build_catalog())
