from app.interview_catalog_seed import build_catalog

def test_phase2_final_domain_questions_preserved():
    by={x['title']:x for x in build_catalog()};assert any('data-quality' in q['text'] for q in by['Data Analyst']['questions']) and any('risk' in q['text'].lower() for q in by['Risk Analyst']['questions'])
