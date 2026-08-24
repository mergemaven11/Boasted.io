from app.interview_catalog_seed import build_catalog

def test_exact_question_category_mix():
    for c in build_catalog():
        cats=[q['category'] for q in c['questions']]
        assert cats.count('behavioral')==8
        for cat in ('motivation','strength','growth','reflection'):assert cats.count(cat)==1
