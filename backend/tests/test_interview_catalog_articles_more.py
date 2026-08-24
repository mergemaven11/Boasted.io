from app.interview_catalog_seed import build_catalog


def test_article_helper_produces_natural_role_prompt():
    by={c['title']:c for c in build_catalog()}
    for title in ['Accountant','Electrician','Operations Manager']:
        text=next(q['text'] for q in by[title]['questions'] if q['category']=='motivation')
        assert f'as an {title}' in text
