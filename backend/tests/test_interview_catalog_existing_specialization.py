from app.interview_catalog_seed import build_catalog

def test_existing_specialized_families_keep_domain_questions():
    by={c['title']:c for c in build_catalog()}
    assert any('data-quality' in q['text'] for q in by['Data Analyst']['questions'])
    assert any('risk or strengthened controls' in q['text'] for q in by['Risk Analyst']['questions'])
