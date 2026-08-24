from app.interview_catalog_seed import build_catalog

def test_requested_roles_have_unique_question_ids():
    by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):
        ids=[q['question_id'] for q in by[x]['questions']];assert len(ids)==len(set(ids))==12
