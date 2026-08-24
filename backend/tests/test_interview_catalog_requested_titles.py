from app.interview_catalog_seed import build_catalog

def test_requested_titles_are_exact():
    titles={c['title'] for c in build_catalog()}
    assert {'Call Center Representative','Risk Analyst','Data Analyst'}<=titles
