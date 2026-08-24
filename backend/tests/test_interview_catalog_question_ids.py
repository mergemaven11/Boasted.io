from app.interview_catalog_seed import build_catalog


def test_question_ids_are_unique_within_each_career():
    for career in build_catalog():
        ids=[q['question_id'] for q in career['questions']]
        assert len(ids)==len(set(ids))==12
