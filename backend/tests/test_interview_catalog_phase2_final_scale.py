from app.interview_catalog_seed import build_catalog

def test_phase2_final_scale():
    c=build_catalog();assert len(c)>=500;assert sum(x['question_count'] for x in c)>=6000
