from app.interview_catalog_seed import build_catalog

def test_phase2_documents_keep_schema_one():assert all(x['schema_version']==1 for x in build_catalog())
