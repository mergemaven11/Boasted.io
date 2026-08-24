from app.interview_catalog_seed import build_catalog

def test_six_thousand_questions_are_generated_without_api_input():assert sum(len(c['questions']) for c in build_catalog())>=6000
