from app.interview_catalog_seed import build_catalog

def test_data_analyst_has_data_quality_question():
    c=next(c for c in build_catalog() if c['title']=='Data Analyst')
    assert any('data-quality' in q['text'] for q in c['questions'])
