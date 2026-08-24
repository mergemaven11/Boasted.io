from app.interview_catalog_seed import build_catalog

def test_phase2_strength_prompts_request_evidence():
    for x in build_catalog():assert 'evidence' in next(q['text'] for q in x['questions'] if q['category']=='strength').lower()
