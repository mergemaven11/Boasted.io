from app.interview_catalog_seed import build_catalog

def test_phase2_behavioral_prompts_request_star_elements():
    for x in build_catalog():
        for q in x['questions']:
            if q['category']=='behavioral':assert 'situation' in q['text'].lower() and 'personally' in q['text'].lower() and 'result' in q['text'].lower()
