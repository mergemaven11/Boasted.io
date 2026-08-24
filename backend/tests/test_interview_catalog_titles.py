from app.interview_catalog_seed import build_catalog


def test_titles_are_unique_after_slug_deduplication():
    catalog=build_catalog()
    assert len({c['slug'] for c in catalog})==len(catalog)
