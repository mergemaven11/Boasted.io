"""Document this first-party Python module."""
from app.resume_builder import parse_existing_resume_text


def test_fragmented_pdf_resume_lines_are_reconstructed():
    """Verify fragmented pdf resume lines are reconstructed."""
    raw = """EXPERIENCE
Zingtree | Technical Support Engineer
August
2021
-
August
2022
• Delivered support for Salesforce, Zendesk, Zapier, and various CRM systems, ensuring seamless integration with our product. • Specialized in writing custom JavaScript for unique scenarios and creating mock sites to mirror customer interfaces for impactful sales demos.
Additionally,
contributed
to
demos
for
Fortune
1000
companies,
maintained
internal/client
documentation,
and
developed Zingtree Chrome Extension V6.
Appen Connect | Social Media Analyst
February
2019-
August
2021
• Analyzed social media content for accuracy, surpassing KPIs by reviewing 50% more posts daily than the 120-post average,
showcasing
exceptional
efficiency
and
quality.
"""

    parsed = parse_existing_resume_text(raw)
    experience = parsed["sections"]["experience"]

    assert "Zingtree | Technical Support Engineer" in experience
    assert "August 2021 – August 2022" in experience
    assert "Appen Connect | Social Media Analyst" in experience
    assert "February 2019 – August 2021" in experience

    rendered = "\n".join(experience)
    assert "Additionally, contributed to demos for Fortune 1000 companies, maintained internal/client documentation, and developed Zingtree Chrome Extension V6." in rendered
    assert "showcasing exceptional efficiency and quality." in rendered
    assert "\ncontributed\n" not in rendered
    assert "\nFortune\n" not in rendered


def test_embedded_bullets_are_split_and_preserved():
    """Verify embedded bullets are split and preserved."""
    parsed = parse_existing_resume_text("""EXPERIENCE
Example Co | Support Engineer
January 2022 - Present
• Resolved production incidents. • Built JavaScript troubleshooting tools for support teams.
""")

    experience = parsed["sections"]["experience"]
    bullets = [line for line in experience if line.startswith("• ")]
    assert bullets == [
        "• Resolved production incidents.",
        "• Built JavaScript troubleshooting tools for support teams.",
    ]
    assert parsed["bullets"] == [
        "Resolved production incidents.",
        "Built JavaScript troubleshooting tools for support teams.",
    ]
