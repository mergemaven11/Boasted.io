"""Regression coverage for the confidence-aware resume parser."""
from app.resume_import_fast_routes import ResumeSaveRequestV2
from app.resume_import_parser_v2 import parse_existing_resume_text


def test_parser_recognizes_broader_core_headings_and_keeps_role_structure():
    raw = """Jordan Lee
Atlanta, GA | jordan@example.com | (404) 555-1212
CAREER HISTORY
Platform Support Engineer | Acme Cloud
Jan 2022 - Present
Remote
• Reduced deployment failures by 31% through release checks.
TECHNICAL EXPERTISE
Python, Linux, Docker, Kubernetes
ACADEMIC HISTORY
Georgia State University | Computer Science
"""
    parsed = parse_existing_resume_text(raw)

    assert "experience" in parsed["sections_found"]
    assert "skills" in parsed["sections_found"]
    assert "education" in parsed["sections_found"]
    assert parsed["experience"][0]["company"] == "Acme Cloud"
    assert parsed["experience"][0]["title"] == "Platform Support Engineer"
    assert parsed["experience"][0]["current"] is True
    assert "Kubernetes" in parsed["skills"]


def test_parser_preserves_extra_sections_for_user_correction_and_templates():
    raw = """Jordan Lee
jordan@example.com
PROFESSIONAL SUMMARY
Support engineer focused on reliable customer-facing systems.
EXPERIENCE
Acme Cloud | Support Engineer
2022 - Present
• Supported enterprise customers and production integrations.
LICENSES AND CERTIFICATIONS
AWS Certified Cloud Practitioner
HONORS & AWARDS
Customer Hero Award, 2024
COMMUNITY INVOLVEMENT
Volunteer Mentor, Code Club
"""
    parsed = parse_existing_resume_text(raw)

    assert parsed["sections"]["certifications"] == ["AWS Certified Cloud Practitioner"]
    assert parsed["sections"]["awards"] == ["Customer Hero Award, 2024"]
    assert parsed["sections"]["volunteer"] == ["Volunteer Mentor, Code Club"]
    assert {"certifications", "awards", "volunteer"}.issubset(parsed["sections_found"])
    assert parsed["parse_quality"]["extra_section_count"] == 3


def test_parser_reports_field_confidence_without_inventing_missing_values():
    raw = """Jordan Lee
jordan@example.com
WORK EXPERIENCE
Senior Support Engineer
2021 - 2024
• Resolved production incidents for enterprise customers.
"""
    parsed = parse_existing_resume_text(raw)

    assert parsed["experience"][0]["company"] == ""
    role_confidence = parsed["field_confidence"]["experience"][0]
    assert role_confidence["company"] == "missing"
    assert role_confidence["title"] in {"low", "medium", "high"}
    assert parsed["field_confidence"]["contact"]["email"] == "high"
    assert parsed["parse_quality"]["warning_count"] >= 1


def test_parser_understands_student_and_research_sections_without_forcing_work_history():
    raw = """Jordan Lee
jordan@university.edu
CAREER OBJECTIVE
Computer science student seeking an infrastructure internship.
ACADEMIC PROJECTS
Campus Status Dashboard
• Built a status dashboard using React and FastAPI.
LEADERSHIP & ACTIVITIES
President, Computing Club
PUBLICATIONS & PRESENTATIONS
Presented accessibility research at the campus symposium.
EDUCATION
State University | B.S. Computer Science | Expected 2027
"""
    parsed = parse_existing_resume_text(raw)

    assert parsed["summary"].startswith("Computer science student")
    assert "projects" in parsed["sections_found"]
    assert "leadership" in parsed["sections_found"]
    assert "publications" in parsed["sections_found"]
    assert parsed["experience"] == []
    assert parsed["parse_quality"]["recognized_section_count"] >= 4


def test_v2_save_payload_keeps_optional_sections_and_template_choice():
    payload = ResumeSaveRequestV2(
        title="Master Resume",
        template_id="academic-burgundy",
        supporting_sections={
            "education": ["State University"],
            "projects": ["Incident Tracker"],
            "certifications": ["AWS Certified Cloud Practitioner"],
            "leadership": ["President, Computing Club"],
            "volunteer": ["Volunteer Mentor"],
            "awards": ["Customer Hero Award"],
            "publications": ["Accessibility research presentation"],
            "languages": ["English", "Spanish"],
        },
    )

    dumped = payload.supporting_sections.model_dump()
    assert dumped["certifications"] == ["AWS Certified Cloud Practitioner"]
    assert dumped["publications"] == ["Accessibility research presentation"]
    assert payload.template_id == "academic-burgundy"
