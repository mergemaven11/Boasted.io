from app.interview_catalog_seed import build_catalog

def test_risk_analyst_has_domain_question():
    c=next(c for c in build_catalog() if c['title']=='Risk Analyst')
    assert any('risk' in q['text'].lower() for q in c['questions'])
