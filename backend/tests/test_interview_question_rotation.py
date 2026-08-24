from app.interview_catalog_seed import build_catalog
from app.interview_question_rotation import select_rotated_questions


def _career(title):
    return next(c for c in build_catalog() if c['title'] == title)


def test_consecutive_interviews_can_avoid_all_previous_questions():
    career = _career('Call Center Representative')
    first = select_rotated_questions(career['questions'], count=10, seed='one')
    first_ids = {q['question_id'] for q in first}
    second = select_rotated_questions(career['questions'], count=10, exclude_ids=first_ids, seed='two')
    second_ids = {q['question_id'] for q in second}
    assert len(first) == len(second) == 10
    assert first_ids.isdisjoint(second_ids)


def test_four_standard_interviews_can_be_unique_with_48_question_bank():
    career = _career('Data Analyst')
    used = set()
    for index in range(4):
        session = select_rotated_questions(career['questions'], count=10, exclude_ids=used, seed=index)
        ids = {q['question_id'] for q in session}
        assert len(session) == 10
        assert used.isdisjoint(ids)
        used.update(ids)
    assert len(used) == 40


def test_rotation_recycles_only_after_fresh_bank_is_too_small():
    career = _career('Risk Analyst')
    excluded = {q['question_id'] for q in career['questions'][:44]}
    selected = select_rotated_questions(career['questions'], count=8, exclude_ids=excluded, seed='recycle')
    selected_ids = {q['question_id'] for q in selected}
    fresh_ids = {q['question_id'] for q in career['questions'][44:]}
    assert fresh_ids <= selected_ids
    assert len(selected) == 8


def test_rotation_mixes_question_categories():
    career = _career('Call Center Representative')
    selected = select_rotated_questions(career['questions'], count=10, seed='categories')
    assert len({q['category'] for q in selected}) >= 5
