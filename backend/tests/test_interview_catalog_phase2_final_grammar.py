from app.interview_catalog_seed import build_catalog

def test_phase2_final_grammar():
    e=next(x for x in build_catalog() if x['title']=='Electrician');assert 'as an Electrician' in next(q['text'] for q in e['questions'] if q['category']=='motivation')
