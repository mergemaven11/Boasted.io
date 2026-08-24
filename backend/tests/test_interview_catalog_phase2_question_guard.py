from app.interview_catalog_seed import build_catalog

def test_phase2_question_link_guard():assert all(len(c['questions'])==12 for c in build_catalog())
