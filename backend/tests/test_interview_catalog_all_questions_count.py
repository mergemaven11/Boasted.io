from app.interview_catalog_seed import build_catalog

def test_total_embedded_questions_at_least_six_thousand():assert sum(len(c['questions']) for c in build_catalog())>=6000
