from app.interview_catalog_seed import build_catalog

def test_every_role_has_questions():assert all(c['questions'] for c in build_catalog())
