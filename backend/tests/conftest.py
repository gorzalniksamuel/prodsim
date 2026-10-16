from collections.abc import AsyncIterator

import httpx
import pytest

from prodsim.api.app import create_app
from prodsim.core.config import Settings


@pytest.fixture
def settings() -> Settings:
    return Settings(environment="test")


@pytest.fixture
async def client(settings: Settings) -> AsyncIterator[httpx.AsyncClient]:
    transport = httpx.ASGITransport(app=create_app(settings))
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        yield c
