from app.interview_catalog_seed import build_catalog

def test_catalog_generation_is_deterministic_python_data():
    first={(c['slug'],c['question_count']) for c in build_catalog()}
    second={(c['slug'],c['question_count']) for c in build_catalog()}
    assert first==second
