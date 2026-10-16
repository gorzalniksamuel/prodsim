import logging
import os
from collections.abc import AsyncIterator, Iterator

import httpx
import pytest
import structlog

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


_LOGGER_NAMES = ("uvicorn", "uvicorn.error", "uvicorn.access", "celery", "celery.app.trace")


@pytest.fixture(autouse=True)
def restore_logging() -> Iterator[None]:
    """Undo global logging/structlog changes made by a test."""
    root = logging.getLogger()
    saved = [
        (lg, lg.handlers[:], lg.level, lg.propagate) for lg in map(logging.getLogger, _LOGGER_NAMES)
    ]
    root_handlers, root_level = root.handlers[:], root.level
    yield
    root.handlers[:] = root_handlers
    root.setLevel(root_level)
    for lg, handlers, level, propagate in saved:
        lg.handlers[:] = handlers
        lg.setLevel(level)
        lg.propagate = propagate
    structlog.reset_defaults()
