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
    assert "Languages | Python," in parsed["sections"]["skills"]


def test_contact_header_does_not_become_resume_section_content():
    raw = """Tobias Scott
Software Engineer / Technical Support Engineer
Atlanta, GA | person@example.com | 470-000-0000
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
