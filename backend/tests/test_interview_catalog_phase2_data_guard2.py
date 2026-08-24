from app.interview_catalog_seed import build_catalog

def test_phase2_data_analyst_preserved():
    c=next(x for x in build_catalog() if x['title']=='Data Analyst');assert c['family']=='data-ai' and len(c['questions'])==12
