from app.interview_catalog_seed import build_catalog

def test_titles_are_strings():assert all(isinstance(c['title'],str) for c in build_catalog())
