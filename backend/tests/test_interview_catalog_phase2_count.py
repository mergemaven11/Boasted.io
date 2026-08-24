from app.interview_catalog_seed import build_catalog


def test_phase2_catalog_exceeds_five_hundred_unique_careers():
    catalog = build_catalog()
    assert len(catalog) >= 500
    assert len({item['slug'] for item in catalog}) == len(catalog)
    assert sum(item['question_count'] for item in catalog) >= 6000
