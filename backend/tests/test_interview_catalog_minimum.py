from app.interview_catalog_seed import build_catalog

def test_phase2_minimum_scale():
    catalog=build_catalog()
    assert len(catalog)>=500, f'expected >=500 careers, got {len(catalog)}'
    assert len(catalog)*12>=6000
