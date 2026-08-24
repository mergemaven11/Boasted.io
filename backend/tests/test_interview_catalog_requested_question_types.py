from app.interview_catalog_seed import build_catalog

def test_requested_question_fields_have_expected_types():
    by={c['title']:c for c in build_catalog()}
    for x in ('Call Center Representative','Risk Analyst','Data Analyst'):
        for q in by[x]['questions']:assert isinstance(q['text'],str) and isinstance(q['competencies'],list) and isinstance(q['active'],bool)
