from app.interview_catalog_seed import build_catalog

def test_question_total_is_at_least_six_thousand():
    assert sum(c['question_count'] for c in build_catalog())>=6000
