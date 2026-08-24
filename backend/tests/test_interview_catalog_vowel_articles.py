from app.interview_catalog_seed import build_catalog

def test_vowel_roles_use_an():
    by={c['title']:c for c in build_catalog()}
    for x in ('Accountant','Electrician','Operations Manager'):
        m=next(q['text'] for q in by[x]['questions'] if q['category']=='motivation');assert f'as an {x}' in m
