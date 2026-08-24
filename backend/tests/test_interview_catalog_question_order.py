from app.interview_catalog_seed import build_catalog

def test_question_order_is_stable():
    for c in build_catalog():
        assert [q['question_id'] for q in c['questions'][:2]]==['behavioral-01','behavioral-02']
