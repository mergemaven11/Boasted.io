"""Document this first-party Python module."""
from datetime import datetime, timezone

import app.observability as observability


class _InsertRecorder:
    """Represent InsertRecorder."""
    def __init__(self):
        """Initialize the instance."""
        self.documents = []

    def create_index(self, *args, **kwargs):
        """Handle create index.

        Args:
            args: Function argument.
            kwargs: Function argument.

        Returns:
            Function result.
        """
        return "idx"

    def insert_one(self, document):
        """Handle insert one.

        Args:
            document: Function argument.

        Returns:
            Function result.
        """
        self.documents.append(document)
        return None


def test_persistent_request_event_is_sanitized(monkeypatch):
    """Verify persistent request event is sanitized.

    Args:
        monkeypatch: Function argument.
    """
    recorder = _InsertRecorder()
    monkeypatch.setattr(observability, "ops_events_collection", recorder)
    monkeypatch.setattr(observability, "_indexes_ready", False)

    observability.record_persistent_request(
        request_id="req-123",
        method="post",
        path="/auth/login",
        status_code=500,
        duration_ms=812.34,
        error_type="RuntimeError",
    )

    event = recorder.documents[0]
    assert event["request_id"] == "req-123"
    assert event["method"] == "POST"
    assert event["path"] == "/auth/login"
    assert event["status_code"] == 500
    assert event["error_type"] == "RuntimeError"
    assert event["error_fingerprint"]
    assert isinstance(event["created_at"], datetime)
    assert event["created_at"].tzinfo == timezone.utc
    assert "headers" not in event
    assert "body" not in event
    assert "query" not in event
    assert "token" not in event
    assert "error_message" not in event
