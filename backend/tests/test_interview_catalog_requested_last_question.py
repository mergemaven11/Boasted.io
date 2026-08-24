from app.interview_catalog_seed import build_catalog

def test_requested_role_question_order_ends_reflection():
    by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):assert by[x]['questions'][-1]['category']=='reflection'
