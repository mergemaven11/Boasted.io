from datetime import datetime, timezone

from bson import ObjectId
from fastapi.testclient import TestClient
import mongomock
import pytest

import app.routes as routes
from app.main import app


client = TestClient(app)


@pytest.fixture
def search_context(monkeypatch):
    mock_client = mongomock.MongoClient()
    collection = mock_client["bragstack_search_security_test"]["entries"]
    monkeypatch.setattr(routes, "entries_collection", collection)

    user = {"_id": ObjectId(), "email": "owner@example.com"}
    app.dependency_overrides[routes.get_current_user] = lambda: user
    try:
        yield collection, user
    finally:
        app.dependency_overrides.pop(routes.get_current_user, None)


def _entry(user, title):
    now = datetime.now(timezone.utc)
    return {
        "user_id": str(user["_id"]),
        "title": title,
        "category": "Engineering",
        "situation": "Test",
        "action": "Test",
        "impact": "Test",
        "lesson": "Test",
        "tags": [],
        "created_at": now,
        "updated_at": now,
    }


def test_search_treats_regex_metacharacters_as_literal_text(search_context):
    collection, user = search_context
    collection.insert_many(
        [
            _entry(user, "alpha.*beta"),
            _entry(user, "alphaZZZbeta"),
        ]
    )

    response = client.get("/entries/search", params={"query": "alpha.*beta"})

    assert response.status_code == 200
    data = response.json()
    assert data["total_results"] == 1
    assert data["entries"][0]["title"] == "alpha.*beta"


def test_search_rejects_overlong_query_before_database_work(search_context):
    response = client.get("/entries/search", params={"query": "x" * 101})

    assert response.status_code == 422


def test_search_rejects_whitespace_only_query(search_context):
    response = client.get("/entries/search", params={"query": "   "})

    assert response.status_code == 422
