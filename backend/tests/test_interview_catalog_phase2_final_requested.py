from app.interview_catalog_seed import build_catalog

def test_phase2_final_requested_roles():
    by={x['title']:x for x in build_catalog()}
    assert by['Call Center Representative']['question_count']==by['Risk Analyst']['question_count']==by['Data Analyst']['question_count']==12
