from app.interview_catalog_seed import build_catalog

def test_requested_role_articles_are_natural():
    by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):
        m=next(q['text'] for q in by[x]['questions'] if q['category']=='motivation');assert f'as a {x}' in m
