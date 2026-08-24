from app.interview_catalog_seed import build_catalog

def test_call_center_has_complete_interview_set():
    c=next(c for c in build_catalog() if c['title']=='Call Center Representative')
    assert c['family']=='customer-contact-center'
    assert {q['category'] for q in c['questions']} >= {'behavioral','motivation','strength','growth','reflection'}
