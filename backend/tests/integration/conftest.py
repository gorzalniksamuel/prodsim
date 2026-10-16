import socket
from collections.abc import AsyncIterator, Iterator
from contextlib import asynccontextmanager

import httpx
import pytest
from testcontainers.community.postgres import PostgresContainer
from testcontainers.community.redis import RedisContainer

from prodsim.api.app import create_app
from prodsim.core.config import Settings

DB_PASSWORD = "s3cr3t-db-pw"
DB_IMAGE = "timescale/timescaledb:latest-pg17"
VALKEY_IMAGE = "valkey/valkey:8-alpine"


@pytest.fixture(scope="session")
def postgres_url() -> Iterator[str]:
    with PostgresContainer(
        DB_IMAGE, username="prodsim", password=DB_PASSWORD, dbname="prodsim"
    ) as pg:
        host = pg.get_container_host_ip()
        port = pg.get_exposed_port(5432)
        yield f"postgresql+asyncpg://prodsim:{DB_PASSWORD}@{host}:{port}/prodsim"


@pytest.fixture(scope="session")
def valkey_url() -> Iterator[str]:
    with RedisContainer(VALKEY_IMAGE) as valkey:
        host = valkey.get_container_host_ip()
        port = valkey.get_exposed_port(6379)
        yield f"redis://{host}:{port}/0"


@pytest.fixture
def closed_port() -> int:
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


@pytest.fixture
def closed_database_url(closed_port: int) -> str:
    return f"postgresql+asyncpg://prodsim:{DB_PASSWORD}@127.0.0.1:{closed_port}/prodsim"


@pytest.fixture
def closed_valkey_url(closed_port: int) -> str:
    return f"redis://127.0.0.1:{closed_port}/0"


@asynccontextmanager
async def running_client(settings: Settings) -> AsyncIterator[httpx.AsyncClient]:
    """Client against an app whose lifespan is running (ASGITransport skips lifespan)."""
    app = create_app(settings)
    transport = httpx.ASGITransport(app=app)
    async with (
        app.router.lifespan_context(app),
        httpx.AsyncClient(transport=transport, base_url="http://testserver") as client,
    ):
        yield client
