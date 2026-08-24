from app.interview_catalog_seed import build_catalog

def test_specialist_roles_are_present():
    titles={c['title'] for c in build_catalog()}
    assert {'Benefits Specialist','Procurement Specialist','Privacy Analyst','SEO Specialist','Credentialing Specialist'}<=titles
