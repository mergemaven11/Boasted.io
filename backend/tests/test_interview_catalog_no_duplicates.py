from app.interview_catalog_seed import build_catalog


def test_catalog_has_no_duplicate_slugs():
    catalog=build_catalog();slugs=[c['slug'] for c in catalog]
    assert len(slugs)==len(set(slugs))
