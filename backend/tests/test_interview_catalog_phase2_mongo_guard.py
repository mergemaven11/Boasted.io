from app.interview_catalog_seed import build_catalog

def test_phase2_documents_have_slug_for_mongo_upsert():assert all(c['slug'] for c in build_catalog())
