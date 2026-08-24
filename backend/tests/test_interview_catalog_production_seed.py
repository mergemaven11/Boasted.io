from app.interview_catalog_seed import build_catalog

def test_seed_documents_have_stable_slug_keys_for_upsert():
    catalog=build_catalog()
    assert len({c['slug'] for c in catalog})==len(catalog)
