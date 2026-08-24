from app.interview_catalog_seed import build_catalog

def test_repeated_builds_have_same_slugs():assert [c['slug'] for c in build_catalog()]==[c['slug'] for c in build_catalog()]
