from app.interview_catalog_seed import build_catalog

def test_creative_roles_include_writing_design_and_media():
    titles={c['title'] for c in build_catalog()}
    assert {'Copywriter','Technical Writer','Graphic Designer','Photographer','Video Editor','Animator'}<=titles
