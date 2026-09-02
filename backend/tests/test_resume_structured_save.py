"""Document this first-party Python module."""
from bson import ObjectId
from pydantic import ValidationError
import pytest

from app import resume_builder_routes as routes


def structured_payload():
    """Handle structured payload.

    Returns:
        Function result.
    """
    return routes.ResumeSaveRequest(
        title="Platform Engineer · Aug 25",
        target_role="Platform Engineer",
        job_description="Platform Engineer role using Kubernetes, Python, incident response, and deployment automation.",
        summary="Platform engineer focused on reliable automation.",
        bullets=[
            routes.ResumeBulletPayload(
                text="Reduced deployment toil by 35%.",
                source_kind="imported",
                source_title="Imported resume",
                has_metrics=True,
            )
        ],
        skills=["Kubernetes", "Python"],
        contact=routes.ResumeContactPayload(name="Jordan Lee", location="Atlanta, GA", email="jordan@example.com"),
        experience=[
            routes.ResumeExperiencePayload(
                company="Example Co",
                title="Platform Engineer",
                location="Atlanta, GA",
                start_date="Jan 2024",
                end_date="present",
                current=True,
                bullets=[
                    routes.ResumeBulletPayload(
                        text="Reduced deployment toil by 35%.",
                        source_kind="imported",
                        source_title="Imported resume",
                        has_metrics=True,
                    )
                ],
            )
        ],
        supporting_sections=routes.ResumeSupportingSectionsPayload(
            projects=["Career platform automation project"],
            education=["Example University — Computer Science"],
        ),
    )


def test_structured_save_payload_keeps_role_boundaries():
    """Verify structured save payload keeps role boundaries."""
    payload = structured_payload()
    assert payload.experience[0].company == "Example Co"
    assert payload.experience[0].title == "Platform Engineer"
    assert payload.experience[0].current is True
    assert payload.experience[0].bullets[0].text == "Reduced deployment toil by 35%."
    assert routes._canonical_saved_bullets(payload)[0].source_kind == "imported"


def test_structured_roles_require_employer_and_title():
    """Verify structured roles require employer and title."""
    with pytest.raises(ValidationError):
        routes.ResumeExperiencePayload(company="", title="Platform Engineer")
    with pytest.raises(ValidationError):
        routes.ResumeExperiencePayload(company="Example Co", title="")


def test_save_resume_writes_structured_schema(monkeypatch):
    """Verify save resume writes structured schema.

    Args:
        monkeypatch: Function argument.

    Returns:
        Function result.
    """
    captured = {}

    class FakeCollection:
        """Represent FakeCollection."""
        def insert_one(self, document):
            """Handle insert one.

            Args:
                document: Function argument.

            Returns:
                Function result.
            """
            captured.update(document)
            return type("InsertResult", (), {"inserted_id": ObjectId("507f1f77bcf86cd799439011")})()

    monkeypatch.setattr(routes, "resume_documents_collection", FakeCollection())
    monkeypatch.setattr(routes, "require_feature", lambda user, feature: None)

    response = routes.save_resume(structured_payload(), current_user={"_id": ObjectId("507f191e810c19729de860ea")})

    assert response["schema_version"] == 4
    assert response["experience"][0]["company"] == "Example Co"
    assert response["experience"][0]["title"] == "Platform Engineer"
    assert response["contact"]["location"] == "Atlanta, GA"
    assert response["supporting_sections"]["projects"] == ["Career platform automation project"]
    assert captured["experience"][0]["bullets"][0]["source_kind"] == "imported"


def test_master_resume_can_save_without_target_job_or_work_history(monkeypatch):
    """Verify master resume can save without target job or work history.

    Args:
        monkeypatch: Function argument.

    Returns:
        Function result.
    """
    captured = {}

    class FakeCollection:
        """Represent FakeCollection."""
        def insert_one(self, document):
            """Handle insert one.

            Args:
                document: Function argument.

            Returns:
                Function result.
            """
            captured.update(document)
            return type("InsertResult", (), {"inserted_id": ObjectId("507f1f77bcf86cd799439012")})()

    monkeypatch.setattr(routes, "resume_documents_collection", FakeCollection())
    monkeypatch.setattr(routes, "require_feature", lambda user, feature: None)

    payload = routes.ResumeSaveRequest(
        title="Master Resume · Aug 25",
        summary="Computer science student focused on platform engineering.",
        skills=["Python", "Linux", "Docker"],
        contact=routes.ResumeContactPayload(name="Jordan Lee", email="jordan@example.com"),
        supporting_sections=routes.ResumeSupportingSectionsPayload(
            projects=["Built a containerized deployment lab using Docker and Linux"],
            education=["Example University — Computer Science"],
        ),
    )

    response = routes.save_resume(payload, current_user={"_id": ObjectId("507f191e810c19729de860ea")})

    assert response["target_role"] == ""
    assert response["job_description"] == ""
    assert response["experience"] == []
    assert response["skills"] == ["Python", "Linux", "Docker"]
    assert captured["supporting_sections"]["education"] == ["Example University — Computer Science"]


def test_legacy_save_payload_without_structured_history_still_validates():
    """Verify legacy save payload without structured history still validates."""
    payload = routes.ResumeSaveRequest(
        title="Legacy saved resume",
        target_role="Support Engineer",
        job_description="Support Engineer role requiring technical troubleshooting and customer communication.",
        bullets=[routes.ResumeBulletPayload(text="Supported customer integrations.", source_kind="imported")],
    )
    assert payload.experience == []
    assert routes._canonical_saved_bullets(payload) == payload.bullets
