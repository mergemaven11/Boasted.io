from app.interview_catalog_seed import build_catalog

def test_new_families_receive_complete_fallback_questions():
    call=next(c for c in build_catalog() if c['title']=='Call Center Representative')
    assert len(call['questions'])==12
    assert sum(q['category']=='behavioral' for q in call['questions'])==8
