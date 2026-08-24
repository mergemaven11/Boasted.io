from app.interview_catalog_seed import build_catalog

def test_phase2_each_role_named_in_motivation():
    for x in build_catalog():assert x['title'] in next(q['text'] for q in x['questions'] if q['category']=='motivation')
