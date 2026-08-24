from app.interview_catalog_seed import build_catalog

def test_phase2_final_star_prompts():
    for x in build_catalog():
        for q in x['questions'][:8]:assert 'situation' in q['text'].lower() and 'result' in q['text'].lower()
