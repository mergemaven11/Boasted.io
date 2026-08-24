from app.interview_catalog_seed import build_catalog

def test_safety_roles_are_present():
    titles={c['title'] for c in build_catalog()}
    assert {'Safety Coordinator','Safety Manager','Fire Inspector','Transportation Security Officer','Security Officer'}<=titles
