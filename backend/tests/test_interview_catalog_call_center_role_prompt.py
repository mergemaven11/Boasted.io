from app.interview_catalog_seed import build_catalog

def test_call_center_motivation_prompt_names_role():
    c=next(c for c in build_catalog() if c['title']=='Call Center Representative')
    assert 'Call Center Representative' in next(q['text'] for q in c['questions'] if q['category']=='motivation')
