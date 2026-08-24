from app.interview_catalog_seed import CATALOG_VERSION,build_catalog

def test_phase2_catalog_version():
    assert CATALOG_VERSION==2
    assert all(c['catalog_version']==2 for c in build_catalog())
