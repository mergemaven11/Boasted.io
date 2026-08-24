from app.interview_catalog_seed import build_catalog

def test_seed_builds_locally_without_external_configuration():
    assert build_catalog()
