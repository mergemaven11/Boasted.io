from app.interview_catalog_seed import build_catalog


def test_phase2_has_at_least_thirty_career_families():
    assert len({item['family'] for item in build_catalog()}) >= 30
