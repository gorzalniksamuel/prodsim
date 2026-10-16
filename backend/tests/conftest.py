import os
from collections.abc import AsyncIterator

import httpx
import pytest

from prodsim.api.app import create_app
from prodsim.core.config import Settings, get_settings


@pytest.fixture(autouse=True)
def clean_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in [k for k in os.environ if k.startswith("PRODSIM_")]:
        monkeypatch.delenv(key)
    get_settings.cache_clear()


@pytest.fixture
def settings() -> Settings:
    return Settings(environment="test")


@pytest.fixture
async def client(settings: Settings) -> AsyncIterator[httpx.AsyncClient]:
    transport = httpx.ASGITransport(app=create_app(settings))
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as c:
        yield c
