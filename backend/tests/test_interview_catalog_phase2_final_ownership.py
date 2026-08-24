from app.interview_catalog_seed import build_catalog

def test_phase2_final_ownership_prompts():
    for x in build_catalog():
        for q in x['questions'][:8]:assert 'personally' in q['text'].lower()
