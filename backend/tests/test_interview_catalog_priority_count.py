from app.interview_catalog_seed import build_catalog

def test_requested_three_are_unique_entries():
    titles=[c['title'] for c in build_catalog()]
    assert all(titles.count(x)==1 for x in ['Call Center Representative','Risk Analyst','Data Analyst'])
