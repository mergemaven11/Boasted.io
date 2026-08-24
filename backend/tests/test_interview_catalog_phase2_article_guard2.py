from app.interview_catalog_seed import build_catalog

def test_phase2_electrician_article_fixed():
    e=next(x for x in build_catalog() if x['title']=='Electrician');m=next(q['text'] for q in e['questions'] if q['category']=='motivation');assert 'as an Electrician' in m
