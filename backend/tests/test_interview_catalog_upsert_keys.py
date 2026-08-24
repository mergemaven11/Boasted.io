from app.interview_catalog_seed import build_catalog

def test_upsert_keys_are_unique():
    slugs=[c['slug'] for c in build_catalog()];assert len(slugs)==len(set(slugs))
