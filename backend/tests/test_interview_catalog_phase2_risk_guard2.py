from app.interview_catalog_seed import build_catalog

def test_phase2_risk_analyst_preserved():
    c=next(x for x in build_catalog() if x['title']=='Risk Analyst');assert c['family']=='business-finance' and len(c['questions'])==12
