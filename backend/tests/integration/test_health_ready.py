import time

import pytest

from prodsim.core.config import Settings

from .conftest import DB_PASSWORD, running_client

pytestmark = pytest.mark.integration


def make_settings(database_url: str, valkey_url: str) -> Settings:
    return Settings(environment="test", database_url=database_url, valkey_url=valkey_url)


def by_name(body: dict[str, object]) -> dict[str, dict[str, object]]:
    checks = body["checks"]
    assert isinstance(checks, list)
    return {c["name"]: c for c in checks}


async def test_ready_ok_when_all_up(postgres_url: str, valkey_url: str) -> None:
    async with running_client(make_settings(postgres_url, valkey_url)) as client:
        response = await client.get("/api/v1/health/ready")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    checks = by_name(body)
    assert checks["database"]["ok"] is True
    assert checks["valkey"]["ok"] is True


async def test_ready_503_when_db_unreachable(valkey_url: str, closed_database_url: str) -> None:
    async with running_client(make_settings(closed_database_url, valkey_url)) as client:
        response = await client.get("/api/v1/health/ready")
        live = await client.get("/api/v1/health/live")
    assert response.status_code == 503
    body = response.json()
    assert body["status"] == "degraded"
    checks = by_name(body)
    assert checks["database"]["ok"] is False
    assert checks["database"]["detail"]
    assert checks["valkey"]["ok"] is True
    assert live.status_code == 200


async def test_ready_503_when_valkey_unreachable(postgres_url: str, closed_valkey_url: str) -> None:
    async with running_client(make_settings(postgres_url, closed_valkey_url)) as client:
        response = await client.get("/api/v1/health/ready")
        live = await client.get("/api/v1/health/live")
    assert response.status_code == 503
    checks = by_name(response.json())
    assert checks["valkey"]["ok"] is False
    assert checks["valkey"]["detail"]
    assert checks["database"]["ok"] is True
    assert live.status_code == 200


async def test_ready_returns_within_timeout() -> None:
    # TEST-NET-1 address: connection attempts hang rather than being refused.
    settings = make_settings(
        f"postgresql+asyncpg://prodsim:{DB_PASSWORD}@192.0.2.1:5432/prodsim",
        "redis://192.0.2.1:6379/0",
    )
    async with running_client(settings) as client:
        start = time.monotonic()
        response = await client.get("/api/v1/health/ready")
        elapsed = time.monotonic() - start
    assert response.status_code == 503
    assert elapsed < 3


async def test_ready_does_not_leak_db_password(valkey_url: str, closed_database_url: str) -> None:
    async with running_client(make_settings(closed_database_url, valkey_url)) as client:
        response = await client.get("/api/v1/health/ready")
    assert DB_PASSWORD not in response.text
    assert closed_database_url not in response.text
