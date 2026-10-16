import json
import re
import uuid
from collections.abc import AsyncIterator

import httpx
import pytest
import structlog

from prodsim.api.app import create_app
from prodsim.core.config import Settings


def _json_lines(text: str) -> list[dict[str, object]]:
    return [json.loads(line) for line in text.splitlines() if line.startswith("{")]


def _http_events(text: str) -> list[dict[str, object]]:
    return [e for e in _json_lines(text) if e.get("event") == "http.request"]


async def test_valid_incoming_request_id_is_echoed(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/meta", headers={"X-Request-ID": "abcd-1234-efgh"})
    assert response.headers["x-request-id"] == "abcd-1234-efgh"


async def test_invalid_request_id_is_replaced_by_uuid(client: httpx.AsyncClient) -> None:
    # httpx refuses a raw newline in a header value, so use other invalid shapes.
    for bad in ("bad id", "short", "x" * 65, "bad_id_with_underscores"):
        response = await client.get("/api/v1/meta", headers={"X-Request-ID": bad})
        returned = response.headers["x-request-id"]
        assert returned != bad
        assert str(uuid.UUID(returned)) == returned


async def test_missing_request_id_is_generated(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/meta")
    assert re.fullmatch(r"[0-9a-f-]{36}", response.headers["x-request-id"])


async def test_http_request_event_is_logged_as_json(
    client: httpx.AsyncClient, capsys: pytest.CaptureFixture[str]
) -> None:
    capsys.readouterr()
    await client.get("/api/v1/meta?token=secret", headers={"X-Request-ID": "abcd-1234-efgh"})
    events = _http_events(capsys.readouterr().out)
    assert len(events) == 1
    event = events[0]
    assert event["request_id"] == "abcd-1234-efgh"
    assert event["status"] == 200
    assert event["method"] == "GET"
    assert event["path"] == "/api/v1/meta"
    assert isinstance(event["duration_ms"], float)
    assert "secret" not in json.dumps(event)


async def test_request_id_does_not_bleed_between_requests(
    client: httpx.AsyncClient, capsys: pytest.CaptureFixture[str]
) -> None:
    capsys.readouterr()
    await client.get("/api/v1/meta", headers={"X-Request-ID": "first-request-id"})
    await client.get("/api/v1/meta")
    events = _http_events(capsys.readouterr().out)
    assert [e["request_id"] for e in events][0] == "first-request-id"
    assert events[1]["request_id"] != "first-request-id"
    assert structlog.contextvars.get_contextvars() == {}


@pytest.fixture
async def crashing_client(settings: Settings) -> AsyncIterator[httpx.AsyncClient]:
    app = create_app(settings)

    @app.get("/boom")
    async def boom() -> None:
        raise RuntimeError("kaboom")

    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        yield c


async def test_unhandled_error_is_logged_with_status_500(
    crashing_client: httpx.AsyncClient, capsys: pytest.CaptureFixture[str]
) -> None:
    capsys.readouterr()
    response = await crashing_client.get("/boom")
    assert response.status_code == 500
    events = _http_events(capsys.readouterr().out)
    assert len(events) == 1
    assert events[0]["status"] == 500
