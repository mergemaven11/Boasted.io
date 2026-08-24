from app.interview_catalog_seed import build_catalog


def test_legal_roles_are_represented():
    titles={c['title'] for c in build_catalog()}
    assert {'Paralegal','Legal Assistant','Attorney','Corporate Counsel','Compliance Officer','Court Clerk'} <= titles
