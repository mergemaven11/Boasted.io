from app.interview_catalog_seed import build_catalog

def test_phase2_final_growth_prompts():
    for x in build_catalog():assert 'skill' in next(q['text'] for q in x['questions'] if q['category']=='growth').lower()
