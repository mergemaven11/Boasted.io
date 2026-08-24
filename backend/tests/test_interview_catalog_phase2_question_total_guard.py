from app.interview_catalog_seed import build_catalog

def test_phase2_question_total_invariant():
    c=build_catalog();assert sum(len(x['questions']) for x in c)>=6000
