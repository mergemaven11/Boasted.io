from app.interview_catalog_seed import build_catalog

def test_question_ids_match_categories():
    for c in build_catalog():
        for q in c['questions']:assert q['question_id'].startswith(q['category']+'-')
