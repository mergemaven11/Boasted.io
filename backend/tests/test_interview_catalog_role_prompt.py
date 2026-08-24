from app.interview_catalog_seed import build_catalog


def test_each_role_appears_in_its_motivation_prompt():
    for c in build_catalog():
        motivation=next(q for q in c['questions'] if q['category']=='motivation')
        assert c['title'] in motivation['text']
