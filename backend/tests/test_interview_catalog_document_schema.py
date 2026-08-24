from app.interview_catalog_seed import build_catalog

def test_career_document_schema_fields_exist():
    required={'schema_version','catalog_version','slug','title','family','aliases','active','questions','question_count','updated_at'}
    assert all(required<=set(c) for c in build_catalog())
