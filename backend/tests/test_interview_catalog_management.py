from app.interview_catalog_seed import build_catalog


def test_management_roles_span_frontline_to_executive():
    titles={c['title'] for c in build_catalog()}
    assert {'Call Center Manager','Warehouse Manager','Restaurant Manager','Engineering Manager','Director of Operations','Chief Executive Officer'} <= titles
