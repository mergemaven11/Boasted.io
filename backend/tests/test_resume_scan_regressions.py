from app.resume_builder import analyze_resume
from app.resume_import_parser import parse_existing_resume_text


def test_ats_scan_returns_score_breakdown_and_actionable_feedback():
    resume = """Tee Example
Atlanta, GA | tee@example.com
PROFESSIONAL SUMMARY
Platform support engineer focused on production reliability and automation.
PROFESSIONAL EXPERIENCE
Acme Cloud | Platform Support Engineer
January 2023 - Present
• Automated Docker and Kubernetes troubleshooting with Python, reducing incident triage time by 35%.
• Built incident response runbooks and monitoring workflows for production systems.
SKILLS
Python, Docker, Kubernetes, Linux, AWS, Incident Response
EDUCATION
Example University | Computer Science
"""
    result = analyze_resume(
        target_role="Platform Support Engineer",
        job_description="Python Docker Kubernetes Linux AWS incident response troubleshooting monitoring",
        receipts=[],
        existing_resume_text=resume,
    )

    scan = result["ats_scan"]
    assert 0 <= scan["score"] <= 100
    assert set(scan["breakdown"]) == {"parsing", "job_match", "readability"}
    assert scan["breakdown"]["job_match"] >= 75
    assert scan["high_score"] is True
    assert scan["strengths"]
    assert scan["improvements"]
    assert "not a prediction" in scan["disclaimer"]


def test_visible_skills_and_work_bullets_are_never_reported_as_absent_signals():
    resume = """Tee Example
SKILLS
Python, Docker, Kubernetes, AWS
PROFESSIONAL EXPERIENCE
Acme | Support Engineer
2022 - Present
• Supported production Docker workloads and automated incident response with Python.
"""
    result = analyze_resume(
        target_role="Support Engineer",
        job_description="Python Docker Kubernetes AWS incident response",
        receipts=[],
        existing_resume_text=resume,
    )

    signals = result["imported_resume"]["source_signals"]
    assert signals["has_skills_heading"] is True
    assert signals["has_work_bullets"] is True
    assert any("Skills are present" in item for item in result["ats_scan"]["strengths"])
    assert any("Work-history bullet evidence" in item for item in result["ats_scan"]["strengths"])


def test_wrapped_bullet_with_role_word_stays_one_bullet():
    resume = """Tee Example
PROFESSIONAL EXPERIENCE
Acme Cloud | Platform Support Engineer
January 2023 - Present
• Partnered with software engineer teams to diagnose production incidents and
restore customer services without inventing unsupported root causes.
SKILLS
Python, Docker
"""
    parsed = parse_existing_resume_text(resume)

    assert len(parsed["experience"]) == 1
    assert parsed["experience"][0]["company"] == "Acme Cloud"
    assert len(parsed["experience"][0]["bullets"]) == 1
    bullet = parsed["experience"][0]["bullets"][0]["text"]
    assert "software engineer teams" in bullet
    assert "restore customer services" in bullet


def test_header_does_not_become_inferred_employment_entry():
    resume = """Tee Example
Platform Support Engineer
Atlanta, GA | tee@example.com | linkedin.com/in/tee
SKILLS
Python, Docker, Kubernetes
EDUCATION
Example University | Computer Science
"""
    parsed = parse_existing_resume_text(resume)

    assert parsed["contact"]["name"] == "Tee Example"
    assert not any(entry.get("company") == "Tee Example" for entry in parsed["experience"])
    assert not any(entry.get("title") == "Platform Support Engineer" for entry in parsed["experience"])


def test_source_section_uncertainty_becomes_warning_not_missing_fact():
    resume = """Tee Example
PROFESSIONAL EXPERIENCE
A role layout the parser cannot safely bind
• Built a reliable production support workflow used by the engineering team.
SKILLS
Platforms | Python, Docker
"""
    parsed = parse_existing_resume_text(resume)

    assert parsed["source_signals"]["has_experience_heading"] is True
    assert parsed["source_signals"]["has_skills_heading"] is True
    assert parsed["skills"]
    assert any("source" in warning.lower() or "visible" in warning.lower() for warning in parsed["parse_warnings"])
