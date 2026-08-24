from app.interview_catalog_seed import build_catalog

def test_nine_questions_are_standard_per_role():
    for c in build_catalog():assert sum(q['difficulty']=='standard' for q in c['questions'])==9
