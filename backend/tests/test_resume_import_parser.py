from app.resume_import_parser import parse_existing_resume_text


def test_fragmented_resume_keeps_sections_and_dates_together():
    raw = """Tobias Scott
Software Engineer / Technical Support Engineer
Atlanta, GA | person@example.com | 470-000-0000
SKILLS
Languages
|
Python,
JavaScript,
React
TECHNICAL PROJECTS
Personal Website
|
React, Twitter API, Google Analytics, Github pages
|
PORTFOLIO • Crafted a portfolio website with integrated GitHub and Twitter feeds. Enhanced visitor engagement through SEO and Google Analytics tracking, significantly boosting daily traffic.
PROFESSIONAL WORK EXPERIENCE
Robin Powered | Senior Support Specialist
|
June
2024
-
July
2025
• Delivered technical support and documented recurring issues for engineering.
Zingtree | Technical Support Engineer
|
August
2021
-
August
2022
• Delivered support for Salesforce, Zendesk, Zapier, and CRM systems.
EDUCATION
Georgia State University | Computer Science
"""
    parsed = parse_existing_resume_text(raw)
    assert "skills" in parsed["sections_found"]
    assert "projects" in parsed["sections_found"]
    assert "experience" in parsed["sections_found"]
    assert "education" in parsed["sections_found"]
    assert all(line != "|" for values in parsed["sections"].values() for line in values)
    experience = parsed["sections"]["experience"]
    assert "June 2024 – July 2025" in experience
    assert "August 2021 – August 2022" in experience
    assert any(line.startswith("• Delivered technical support") for line in experience)
    assert "Languages | Python, JavaScript, React" in parsed["sections"]["skills"]
    assert all(",," not in line for line in parsed["sections"]["skills"])

    jobs = parsed["experience"]
    assert len(jobs) == 2
    assert jobs[0]["company"] == "Robin Powered"
    assert jobs[0]["title"] == "Senior Support Specialist"
    assert jobs[0]["start_date"] == "June 2024"
    assert jobs[0]["end_date"] == "July 2025"
    assert jobs[0]["bullets"][0]["text"].startswith("Delivered technical support")
    assert jobs[1]["company"] == "Zingtree"
    assert jobs[1]["title"] == "Technical Support Engineer"


def test_contact_header_does_not_become_resume_section_content():
    raw = """Tobias Scott
Software Engineer / Technical Support Engineer
Atlanta, GA | person@example.com | 470-000-0000 | linkedin.com/in/tobias-scott
PROJECTS
Personal Website
• Built a portfolio website.
EXPERIENCE
Zingtree | Technical Support Engineer
August 2021 - August 2022
• Supported customer integrations.
"""
    parsed = parse_existing_resume_text(raw)
    assert parsed["header_lines"][0] == "Tobias Scott"
    assert any("person@example.com" in line for line in parsed["header_lines"])
    assert "Personal Website" in parsed["sections"]["projects"]
    assert parsed["contact"]["name"] == "Tobias Scott"
    assert parsed["contact"]["email"] == "person@example.com"
    assert "470-000-0000" in parsed["contact"]["phone"]
    assert parsed["contact"]["location"] == "Atlanta, GA"
    assert "linkedin.com/in/tobias-scott" in parsed["contact"]["linkedin"]


def test_title_then_company_pair_is_reconstructed():
    raw = """Jane Doe
jane@example.com
EXPERIENCE
Platform Engineer | Acme Cloud
Jan 2022 - Present
Remote
• Built deployment automation used by engineering teams.
• Reduced release failures by 30% through pipeline checks.
EDUCATION
State University
"""
    parsed = parse_existing_resume_text(raw)
    assert len(parsed["experience"]) == 1
    job = parsed["experience"][0]
    assert job["company"] == "Acme Cloud"
    assert job["title"] == "Platform Engineer"
    assert job["current"] is True
    assert job["end_date"] == "present"
    assert job["location"] == "Remote"
    assert len(job["bullets"]) == 2


def test_missing_company_is_flagged_for_confirmation():
    raw = """Jane Doe
EXPERIENCE
Senior Software Engineer
2021 - 2024
• Built internal tooling used across three teams.
"""
    parsed = parse_existing_resume_text(raw)
    assert parsed["experience"][0]["title"] == "Senior Software Engineer"
    assert parsed["experience"][0]["company"] == ""
    assert any("Confirm employer" in warning for warning in parsed["parse_warnings"])


def test_combined_company_title_location_and_dates_are_reconstructed():
    raw = """Jane Doe
jane@example.com
WORK HISTORY
Acme Cloud | Platform Support Engineer | Atlanta, GA | Jan 2022 - Present
• Built deployment automation used by engineering teams.
"""
    parsed = parse_existing_resume_text(raw)
    assert len(parsed["experience"]) == 1
    job = parsed["experience"][0]
    assert job["company"] == "Acme Cloud"
    assert job["title"] == "Platform Support Engineer"
    assert job["location"] == "Atlanta, GA"
    assert job["start_date"] == "Jan 2022"
    assert job["end_date"] == "present"


def test_title_then_company_on_separate_lines_is_reconstructed():
    raw = """Jane Doe
PROFESSIONAL EXPERIENCE
Platform Support Engineer
Acme Cloud
Jan 2022 - Present
Remote
• Built deployment automation used by engineering teams.
"""
    parsed = parse_existing_resume_text(raw)
    assert len(parsed["experience"]) == 1
    job = parsed["experience"][0]
    assert job["company"] == "Acme Cloud"
    assert job["title"] == "Platform Support Engineer"
    assert job["location"] == "Remote"


def test_work_history_can_be_inferred_without_standard_heading():
    raw = """Jane Doe
Atlanta, GA | jane@example.com
Platform Support Engineer | Acme Cloud
Jan 2022 - Present
Remote
• Built deployment automation used by engineering teams.
EDUCATION
State University
"""
    parsed = parse_existing_resume_text(raw)
    assert len(parsed["experience"]) == 1
    assert parsed["experience"][0]["company"] == "Acme Cloud"
    assert "experience" in parsed["sections_found"]
    assert any("inferred" in warning.lower() for warning in parsed["parse_warnings"])
