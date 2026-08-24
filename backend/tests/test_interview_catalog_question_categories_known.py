from app.interview_catalog_seed import build_catalog

def test_categories_are_known():
    allowed={'behavioral','motivation','strength','growth','reflection'}
    assert all(q['category'] in allowed for c in build_catalog() for q in c['questions'])
