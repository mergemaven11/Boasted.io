from app.interview_catalog_seed import build_catalog

def test_question_schema_fields_exist():
    required={'question_id','text','category','competencies','difficulty','active'}
    assert all(required<=set(q) for c in build_catalog() for q in c['questions'])
