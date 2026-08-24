from app.interview_catalog_seed import build_catalog

def test_question_texts_are_unique_within_role():
    for c in build_catalog():
        texts=[q['text'] for q in c['questions']];assert len(texts)==len(set(texts))
