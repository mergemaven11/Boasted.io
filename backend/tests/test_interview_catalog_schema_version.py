from app.interview_catalog_seed import build_catalog

def test_schema_version_remains_compatible():
    assert {c['schema_version'] for c in build_catalog()}=={1}
