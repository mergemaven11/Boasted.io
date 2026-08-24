from app.interview_catalog_seed import build_catalog


def test_requested_roles_have_twelve_linked_questions():
    by_title = {item['title']: item for item in build_catalog()}
    for title in ('Call Center Representative', 'Risk Analyst', 'Data Analyst'):
        assert title in by_title
        assert by_title[title]['question_count'] == 12
        assert len(by_title[title]['questions']) == 12
