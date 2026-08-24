from app.interview_catalog_seed import build_catalog

def test_phase2_catalog_documents_keep_existing_api_shape():
    c=build_catalog()[0];assert {'slug','title','family','questions','question_count'}<=set(c)
