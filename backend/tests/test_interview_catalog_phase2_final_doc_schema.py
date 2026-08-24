from app.interview_catalog_seed import build_catalog

def test_phase2_final_document_schema():
    r={'schema_version','catalog_version','slug','title','family','aliases','active','questions','question_count','updated_at'};assert all(r<=set(x) for x in build_catalog())
