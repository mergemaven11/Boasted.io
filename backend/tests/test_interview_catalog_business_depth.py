from app.interview_catalog_seed import build_catalog

def test_business_roles_span_analysis_and_operations():
    titles={c['title'] for c in build_catalog()}
    assert {'Business Analyst','Operations Analyst','Pricing Analyst','Revenue Operations Analyst','Process Improvement Specialist','Strategy Analyst'}<=titles
