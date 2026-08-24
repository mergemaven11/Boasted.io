from fastapi.testclient import TestClient
from pymongo.errors import ServerSelectionTimeoutError

import app.main as main


client = TestClient(main.app)


def test_health_reports_process_alive():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_ready_reports_ready_when_mongo_responds(monkeypatch):
    monkeypatch.setattr(main.mongo_client.admin, "command", lambda command: {"ok": 1.0})

    response = client.get("/ready")

    assert response.status_code == 200
    assert response.json() == {"status": "ready"}


def test_ready_fails_safely_when_mongo_is_unavailable(monkeypatch):
    def fail_ping(command):
        raise ServerSelectionTimeoutError("mongodb unavailable")

    monkeypatch.setattr(main.mongo_client.admin, "command", fail_ping)

    response = client.get("/ready")

    assert response.status_code == 503
    assert response.json() == {"detail": "Service is not ready"}
    assert "mongodb" not in response.text.lower()
