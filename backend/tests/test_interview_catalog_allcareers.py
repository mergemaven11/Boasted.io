from app.interview_catalog_seed import build_catalog

def test_catalog_reaches_phase2_all_career_breadth_goal():
    catalog=build_catalog()
    assert len(catalog)>=500
    assert len({c['family'] for c in catalog})>=30
