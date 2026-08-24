from app.interview_catalog_seed import build_catalog


def test_every_career_has_family():
    assert all(c['family'].strip() for c in build_catalog())
