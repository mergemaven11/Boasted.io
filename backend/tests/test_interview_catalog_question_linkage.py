from app.interview_catalog_seed import build_catalog

def test_questions_remain_embedded_with_career_documents():
    assert all(isinstance(c['questions'],list) and len(c['questions'])==12 for c in build_catalog())
