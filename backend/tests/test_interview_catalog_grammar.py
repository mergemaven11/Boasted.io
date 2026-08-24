from app.interview_catalog_seed import build_catalog

def test_no_known_a_an_regression_for_vowel_roles():
    for c in build_catalog():
        if c['title'][0].lower() in 'aeiou':
            m=next(q['text'] for q in c['questions'] if q['category']=='motivation')
            assert f'as a {c["title"]}' not in m
