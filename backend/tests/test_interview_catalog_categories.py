from app.interview_catalog_seed import build_catalog


def test_each_career_has_full_question_mix():
    for c in build_catalog():
        cats=[q['category'] for q in c['questions']]
        assert cats.count('behavioral')==8
        assert set(cats)>= {'motivation','strength','growth','reflection'}
