from bson import ObjectId
from fastapi.testclient import TestClient

import app.main as main
import app.ops_routes as ops_routes
from app.auth import get_current_user
from app.ops_debug import clear_for_tests

client = TestClient(main.app)


def _user(email="engineer@usebragstack.com", roles=None):
    return {
        "_id": ObjectId(),
        "email": email,
        "name": "Ops Tester",
        "internal_roles": roles or [],
        "email_verification_required": False,
        "plan": "pro",
    }


def _override_user(user):
    async def dependency():
        return user
    main.app.dependency_overrides[get_current_user] = dependency


def teardown_function():
    main.app.dependency_overrides.clear()
    clear_for_tests()


def test_company_domain_alone_does_not_grant_ops_access():
    _override_user(_user(roles=[]))
    response = client.get("/ops/access")
    assert response.status_code == 403


def test_internal_role_outside_company_domain_does_not_grant_access():
    _override_user(_user(email="attacker@example.com", roles=["admin"]))
    response = client.get("/ops/access")
    assert response.status_code == 403


def test_explicit_internal_role_grants_access():
    _override_user(_user(roles=["ops"]))
    response = client.get("/ops/access")
    assert response.status_code == 200
    assert response.json()["authorized"] is True
    assert response.json()["roles"] == ["ops"]


def test_overview_exposes_sanitized_live_request_telemetry(monkeypatch):
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
