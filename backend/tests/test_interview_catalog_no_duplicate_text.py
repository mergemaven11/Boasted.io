from app.interview_catalog_seed import build_catalog

def test_no_duplicate_question_text_per_career():
    for c in build_catalog():
        texts=[q['text'] for q in c['questions']];assert len(texts)==len(set(texts))
