from app.interview_catalog_seed import build_catalog


def test_office_roles_are_represented():
    titles={c['title'] for c in build_catalog()}
    assert {'Administrative Assistant','Executive Assistant','Receptionist','Office Manager','Data Entry Clerk','Scheduling Coordinator'} <= titles
