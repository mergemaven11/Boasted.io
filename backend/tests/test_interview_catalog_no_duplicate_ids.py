from app.interview_catalog_seed import build_catalog

def test_no_duplicate_question_ids_per_career():
    for c in build_catalog():
        ids=[q['question_id'] for q in c['questions']];assert len(ids)==len(set(ids))
