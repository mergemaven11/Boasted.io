from app.interview_catalog_seed import build_catalog

def test_phase2_creative_guard():assert {'Graphic Designer','Copywriter','Photographer','Video Editor','Content Creator'}<={c['title'] for c in build_catalog()}
