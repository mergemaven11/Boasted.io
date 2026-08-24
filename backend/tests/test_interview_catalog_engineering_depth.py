from app.interview_catalog_seed import build_catalog

def test_engineering_roles_span_disciplines():
    titles={c['title'] for c in build_catalog()}
    assert {'Mechanical Engineer','Electrical Engineer','Civil Engineer','Aerospace Engineer','Biomedical Engineer','Robotics Engineer'}<=titles
