from app.interview_catalog_seed import build_catalog


def test_catalog_metadata_is_consistent():
    for career in build_catalog():
        assert career['schema_version']==1
        assert career['catalog_version']==2
        assert career['active'] is True
