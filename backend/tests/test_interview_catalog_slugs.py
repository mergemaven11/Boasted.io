from app.interview_catalog_seed import build_catalog


def test_slugs_are_stable_and_url_safe():
    for c in build_catalog():
        assert c['slug']
        assert c['slug']==c['slug'].lower()
        assert ' ' not in c['slug']
