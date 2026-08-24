from app.interview_catalog_seed import build_catalog

def test_titles_are_nontrivial():assert min(len(c['title']) for c in build_catalog())>=4
