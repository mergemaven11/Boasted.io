from app.interview_catalog_seed import build_catalog

def test_requested_role_question_texts_unique():
    by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):
        texts=[q['text'] for q in by[x]['questions']];assert len(texts)==len(set(texts))
