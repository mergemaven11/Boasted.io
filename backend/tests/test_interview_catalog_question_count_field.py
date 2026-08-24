from app.interview_catalog_seed import build_catalog

def test_question_count_matches_embedded_array():
    assert all(c['question_count']==len(c['questions']) for c in build_catalog())
