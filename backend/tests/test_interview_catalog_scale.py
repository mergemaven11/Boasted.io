from app.interview_catalog_seed import build_catalog


def test_catalog_scale_and_diversity():
    catalog=build_catalog()
    assert len(catalog)>=500
    assert sum(c['question_count'] for c in catalog)>=6000
    assert len({c['family'] for c in catalog})>=30
