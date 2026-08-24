from app.interview_catalog_seed import build_catalog


def test_media_roles_are_represented():
    titles={c['title'] for c in build_catalog()}
    assert {'Copywriter','Journalist','Photographer','Video Editor','Creative Director','Content Creator'} <= titles
