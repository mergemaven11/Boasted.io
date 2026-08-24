from app.interview_catalog_seed import build_catalog

def test_phase2_grammar_guard():
    e=next(c for c in build_catalog() if c['title']=='Electrician');assert any('an Electrician' in q['text'] for q in e['questions'])
