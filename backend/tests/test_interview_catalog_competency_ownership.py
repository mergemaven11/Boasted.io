from app.interview_catalog_seed import build_catalog

def test_behavioral_questions_tag_ownership_and_impact():
    assert all({'ownership','impact'}<=set(q['competencies']) for c in build_catalog() for q in c['questions'] if q['category']=='behavioral')
