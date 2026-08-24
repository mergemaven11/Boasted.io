from app.interview_catalog_seed import build_catalog


def test_community_roles_are_represented():
    titles={c['title'] for c in build_catalog()}
    assert {'Community Health Worker','Youth Counselor','Peer Support Specialist','Housing Specialist','Eligibility Specialist','Volunteer Coordinator'} <= titles
