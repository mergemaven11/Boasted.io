from app.interview_catalog_seed import build_catalog

def test_every_role_has_at_least_two_role_named_prompts():
    for c in build_catalog():assert sum(c['title'] in q['text'] for q in c['questions'])>=2
