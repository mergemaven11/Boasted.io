from app.interview_catalog_seed import build_catalog

def test_question_set_size_is_consistent():assert {len(c['questions']) for c in build_catalog()}=={12}
