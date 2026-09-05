"""Document this first-party Python module."""
from bson import ObjectId
from fastapi.testclient import TestClient

import app.main as main
import app.ops_routes as ops_routes
import app.ops_user_routes as ops_user_routes
from app.auth import get_current_user
from app.ops_debug import clear_for_tests

client = TestClient(main.app)


def _user(email="engineer@usebragstack.com", roles=None):
    """Handle user.

    Args:
        email: Function argument.
        roles: Function argument.

    Returns:
        Function result.
    """
    return {
        "_id": ObjectId(),
        "email": email,
        "name": "Ops Tester",
        "internal_roles": roles or [],
        "email_verification_required": False,
        "plan": "pro",
    }


def _override_user(user):
    """Handle override user.

    Args:
        user: Function argument.

    Returns:
        Function result.
    """
    async def dependency():
        """Handle dependency.

        Returns:
            Function result.
        """
        return user
    main.app.dependency_overrides[get_current_user] = dependency


def teardown_function():
    """Handle teardown function."""
    main.app.dependency_overrides.clear()
    clear_for_tests()


def test_unassigned_account_does_not_discover_ops_route():
    """Verify an unassigned account gets a not-found response for internal routes."""
    _override_user(_user(roles=[]))
    response = client.get("/ops/access")
    assert response.status_code == 404
    assert response.json()["detail"] == "Not found"


def test_explicit_role_can_authorize_verified_account_from_any_domain():
    """Verify explicit role assignment, not email domain, is the internal access boundary."""
    _override_user(_user(email="trusted-counsel@example.com", roles=["security"]))
    response = client.get("/ops/access")
    assert response.status_code == 200
    assert response.json()["roles"] == ["security"]


def test_unverified_account_cannot_use_internal_role():
    """Verify internal roles do not activate before required email verification."""
    user = _user(email="operator@example.com", roles=["ops"])
    user["email_verification_required"] = True
    user["email_verified_at"] = None
    _override_user(user)
    response = client.get("/ops/access")
    assert response.status_code == 404


def test_owner_email_is_bootstrap_admin():
    """Verify the founder owner account retains a bootstrap recovery admin role."""
    _override_user(_user(email="tobias.scott@usebragstack.com", roles=[]))
    response = client.get("/ops/access")
    assert response.status_code == 200
    assert "admin" in response.json()["roles"]


def test_explicit_internal_role_grants_access():
    """Verify explicit internal role grants access."""
    _override_user(_user(roles=["ops"]))
    response = client.get("/ops/access")
    assert response.status_code == 200
    assert response.json()["authorized"] is True
    assert response.json()["roles"] == ["ops"]


def test_overview_exposes_sanitized_live_request_telemetry(monkeypatch):
    """Verify overview exposes sanitized live request telemetry.

    Args:
        monkeypatch: Function argument.
    """
    _override_user(_user(roles=["admin"]))
    monkeypatch.setattr(main.mongo_admin, "command", lambda command: {"ok": 1.0})
    monkeypatch.setattr(ops_routes.mongo_client.admin, "command", lambda command: {"ok": 1.0})
    for collection in (
        ops_routes.users_collection,
        ops_routes.entries_collection,
        ops_routes.impact_receipts_collection,
        ops_routes.resume_documents_collection,
    ):
        monkeypatch.setattr(collection, "count_documents", lambda query: 2)

    health = client.get("/health")
    assert health.status_code == 200
    assert health.headers.get("x-request-id")

    response = client.get("/ops/overview")
    assert response.status_code == 200
    payload = response.json()
    assert payload["service"]["mongo"] == "ok"
    assert payload["database"]["users"] == 2
    assert any(event["path"] == "/health" for event in payload["requests"]["recent"])
    assert all("headers" not in event and "body" not in event for event in payload["requests"]["recent"])


def test_user_diagnostics_are_redacted(monkeypatch):
    """Verify user diagnostics are redacted.

    Args:
        monkeypatch: Function argument.
    """
    _override_user(_user(roles=["support"]))
    target = _user(email="member@example.com", roles=[])
    target.update({"password_hash": "secret", "reset_token": "secret", "oauth_token": "secret"})
    monkeypatch.setattr(ops_routes.users_collection, "find_one", lambda query: target)
    monkeypatch.setattr(ops_routes.entries_collection, "count_documents", lambda query: 3)
    monkeypatch.setattr(ops_routes.impact_receipts_collection, "count_documents", lambda query: 1)
    monkeypatch.setattr(ops_routes.resume_documents_collection, "count_documents", lambda query: 2)

    response = client.get("/ops/users", params={"email": "member@example.com"})
    assert response.status_code == 200
    payload = response.json()
    assert payload["email"] == "member@example.com"
    assert payload["counts"] == {"entries": 3, "impact_receipts": 1, "resume_documents": 2}
    assert "password_hash" not in payload
    assert "reset_token" not in payload
    assert "oauth_token" not in payload


def test_non_admin_cannot_manage_team():
    """Verify non admin cannot manage team."""
    _override_user(_user(roles=["ops"]))
    response = client.get("/ops/team")
    assert response.status_code == 404


def test_admin_can_update_user_roles_and_audit(monkeypatch):
    """Verify admin can update user roles and audit.

    Args:
        monkeypatch: Function argument.
    """
    actor = _user(email="admin@usebragstack.com", roles=["admin"])
    target = _user(email="support@usebragstack.com", roles=["support"])
    _override_user(actor)

    monkeypatch.setattr(ops_routes.users_collection, "find_one", lambda query: target)
    monkeypatch.setattr(ops_routes.users_collection, "update_one", lambda query, update: None)
    recorded = []
    monkeypatch.setattr(ops_routes.ops_audit_collection, "insert_one", lambda event: recorded.append(event))

    response = client.patch(f"/ops/team/{target['_id']}/roles", json={"roles": ["ops", "security"]})
    assert response.status_code == 200
    assert response.json()["roles"] == ["ops", "security"]
    assert recorded[0]["actor_email"] == "admin@usebragstack.com"
    assert recorded[0]["target_email"] == "support@usebragstack.com"
    assert recorded[0]["previous_roles"] == ["support"]
    assert recorded[0]["next_roles"] == ["ops", "security"]


def test_admin_can_assign_verified_account_by_email(monkeypatch):
    """Verify an admin can explicitly grant access to an existing verified account."""
    actor = _user(email="admin@usebragstack.com", roles=["admin"])
    target = _user(email="trusted-counsel@example.com", roles=[])
    _override_user(actor)
    monkeypatch.setattr(ops_routes.users_collection, "find_one", lambda query: target)
    monkeypatch.setattr(ops_routes.users_collection, "update_one", lambda query, update: None)
    recorded = []
    monkeypatch.setattr(ops_routes.ops_audit_collection, "insert_one", lambda event: recorded.append(event))

    response = client.post("/ops/team/assign", json={"email": "trusted-counsel@example.com", "roles": ["security"]})
    assert response.status_code == 200
    assert response.json()["email"] == "trusted-counsel@example.com"
    assert response.json()["roles"] == ["security"]
    assert recorded[0]["target_email"] == "trusted-counsel@example.com"


def test_admin_cannot_assign_unverified_account(monkeypatch):
    """Verify unverified accounts cannot be granted internal access."""
    actor = _user(email="admin@usebragstack.com", roles=["admin"])
    target = _user(email="pending@example.com", roles=[])
    target["email_verification_required"] = True
    target["email_verified_at"] = None
    _override_user(actor)
    monkeypatch.setattr(ops_routes.users_collection, "find_one", lambda query: target)

    response = client.post("/ops/team/assign", json={"email": "pending@example.com", "roles": ["support"]})
    assert response.status_code == 409
    assert "verify" in response.json()["detail"].lower()


def test_last_database_admin_cannot_be_removed_without_bootstrap(monkeypatch):
    """Verify last database admin cannot be removed without bootstrap.

    Args:
        monkeypatch: Function argument.
    """
    _override_user(_user(roles=["admin"]))
    target = _user(email="lastadmin@usebragstack.com", roles=["admin"])
    monkeypatch.setattr(ops_routes, "BOOTSTRAP_ADMINS", set())
    monkeypatch.setattr(ops_routes.users_collection, "find_one", lambda query: target)
    monkeypatch.setattr(ops_routes.users_collection, "count_documents", lambda query: 1)

    response = client.patch(f"/ops/team/{target['_id']}/roles", json={"roles": ["ops"]})
    assert response.status_code == 409
    assert "admin" in response.json()["detail"].lower()


def test_bootstrap_admin_role_cannot_be_effectively_removed(monkeypatch):
    """Verify bootstrap admin role cannot be effectively removed.

    Args:
        monkeypatch: Function argument.
    """
    actor = _user(email="bootstrap@usebragstack.com", roles=[])
    target = _user(email="bootstrap@usebragstack.com", roles=["admin"])
    monkeypatch.setattr(ops_routes, "BOOTSTRAP_ADMINS", {"bootstrap@usebragstack.com"})
    _override_user(actor)
    monkeypatch.setattr(ops_routes.users_collection, "find_one", lambda query: target)
    monkeypatch.setattr(ops_routes.users_collection, "update_one", lambda query, update: None)
    monkeypatch.setattr(ops_routes.ops_audit_collection, "insert_one", lambda event: None)

    response = client.patch(f"/ops/team/{target['_id']}/roles", json={"roles": []})
    assert response.status_code == 200
    assert response.json()["bootstrap_admin"] is True
    assert "admin" in response.json()["effective_roles"]


def test_support_can_resend_verification_email_and_action_is_audited(monkeypatch):
    """Verify support can resend verification email and action is audited.

    Args:
        monkeypatch: Function argument.
    """
    actor = _user(email="support@usebragstack.com", roles=["support"])
    target = _user(email="member@example.com", roles=[])
    target["email_verification_required"] = True
    _override_user(actor)

    monkeypatch.setattr(ops_user_routes.users_collection, "find_one", lambda query: target)
    monkeypatch.setattr(ops_user_routes, "_issue_verification_token", lambda user: ("fresh-token", None))
    sent = []

    async def fake_send(email, url):
        """Handle fake send.

        Args:
            email: Function argument.
            url: Function argument.
        """
        sent.append((email, url))

    monkeypatch.setattr(ops_user_routes, "_send_verification_email", fake_send)
    recorded = []
    monkeypatch.setattr(ops_user_routes.ops_audit_collection, "insert_one", lambda event: recorded.append(event))

    response = client.post(f"/ops/user-directory/{target['_id']}/resend-verification")
    assert response.status_code == 200
    assert response.json()["email"] == "member@example.com"
    assert sent == [("member@example.com", f"{ops_user_routes.FRONTEND_URL}/login#verify_token=fresh-token")]
    assert recorded[0]["event"] == "verification_email_resent"
    assert recorded[0]["actor_email"] == "support@usebragstack.com"
    assert recorded[0]["target_email"] == "member@example.com"


def test_verification_resend_rejects_already_verified_account(monkeypatch):
    """Verify verification resend rejects already verified account.

    Args:
        monkeypatch: Function argument.
    """
    actor = _user(email="support@usebragstack.com", roles=["support"])
    target = _user(email="member@example.com", roles=[])
    target["email_verified_at"] = "2026-08-26T20:00:00+00:00"
    _override_user(actor)
    monkeypatch.setattr(ops_user_routes.users_collection, "find_one", lambda query: target)

    response = client.post(f"/ops/user-directory/{target['_id']}/resend-verification")
    assert response.status_code == 409
    assert "already verified" in response.json()["detail"].lower()
