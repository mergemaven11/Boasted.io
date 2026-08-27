import asyncio

from starlette.background import BackgroundTask, BackgroundTasks
from starlette.responses import Response

import app.main as main


def _telemetry_kwargs():
    return {
        "request_id": "req-background",
        "method": "GET",
        "path": "/health",
        "status_code": 200,
        "duration_ms": 12.5,
    }


def test_persistent_request_is_deferred_until_background_runs(monkeypatch):
    calls = []
    monkeypatch.setattr(main, "record_persistent_request", lambda **kwargs: calls.append(kwargs))
    response = Response("ok")

    main._defer_persistent_request(response, **_telemetry_kwargs())

    assert calls == []
    assert isinstance(response.background, BackgroundTask)

    asyncio.run(response.background())

    assert calls == [_telemetry_kwargs()]


def test_existing_background_task_is_preserved(monkeypatch):
    order = []
    monkeypatch.setattr(
        main,
        "record_persistent_request",
        lambda **kwargs: order.append(("telemetry", kwargs["request_id"])),
    )
    response = Response("ok")
    response.background = BackgroundTask(lambda: order.append(("existing", None)))

    main._defer_persistent_request(response, **_telemetry_kwargs())

    assert isinstance(response.background, BackgroundTasks)
    asyncio.run(response.background())

    assert order == [("existing", None), ("telemetry", "req-background")]
