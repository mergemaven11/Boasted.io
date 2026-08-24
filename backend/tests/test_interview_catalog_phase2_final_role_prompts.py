from app.interview_catalog_seed import build_catalog

def test_phase2_final_role_prompts():
    for x in build_catalog():assert x['title'] in next(q['text'] for q in x['questions'] if q['category']=='motivation')
