from app.interview_catalog_seed import build_catalog


def test_government_roles_are_represented():
    titles={c['title'] for c in build_catalog()}
    assert {'City Clerk','Program Analyst','Budget Analyst','Grants Specialist','Tax Examiner','Public Information Officer'} <= titles
