from app.interview_catalog_seed import build_catalog

def test_phase2_questions_are_embedded_in_each_career():assert all(isinstance(x['questions'],list) for x in build_catalog())
