from app.interview_catalog_seed import build_catalog


def test_vowel_starting_roles_use_an_in_motivation_question():
    by_title={item['title']:item for item in build_catalog()}
    for title in ('Electrician','Accountant','Aircraft Mechanic','Operations Manager'):
        motivation=next(q for q in by_title[title]['questions'] if q['category']=='motivation')
        assert f'as an {title}' in motivation['text']
