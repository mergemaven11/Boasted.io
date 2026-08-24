from app.interview_catalog_seed import build_catalog

def test_two_difficulty_levels_exist():assert {q['difficulty'] for c in build_catalog() for q in c['questions']}=={'standard','stretch'}
