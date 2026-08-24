from app.interview_catalog_seed import build_catalog

def test_priority_role_question_ids_are_stable():
    c=next(c for c in build_catalog() if c['title']=='Call Center Representative')
    assert c['questions'][0]['question_id']=='behavioral-01'
    assert c['questions'][-1]['question_id']=='reflection-04'
