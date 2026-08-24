from app.interview_catalog_seed import build_catalog


def test_catalog_questions_are_materialized_without_model_calls():
    career=next(c for c in build_catalog() if c['title']=='Call Center Representative')
    assert all(isinstance(q['text'],str) and q['text'] for q in career['questions'])
    assert career['catalog_version']==2
