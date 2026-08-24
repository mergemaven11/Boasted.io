from app.interview_catalog_seed import build_catalog


def test_hr_roles_are_represented():
    titles={c['title'] for c in build_catalog()}
    assert {'Human Resources Generalist','Recruiter','Technical Recruiter','Payroll Specialist','HRIS Analyst','Onboarding Specialist'} <= titles
