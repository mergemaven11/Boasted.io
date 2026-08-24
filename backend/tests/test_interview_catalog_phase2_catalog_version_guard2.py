from app.interview_catalog_seed import build_catalog

def test_phase2_documents_are_version_two():assert all(x['catalog_version']==2 for x in build_catalog())
