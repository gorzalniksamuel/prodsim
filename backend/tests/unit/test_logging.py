import json
import logging

import pytest
import structlog
from pydantic import SecretStr

from prodsim.core.config import Settings
from prodsim.core.logging import configure_logging


def test_configure_logging_is_idempotent() -> None:
    settings = Settings(environment="test")
    configure_logging(settings)
    count = len(logging.getLogger().handlers)
    configure_logging(settings)
    assert len(logging.getLogger().handlers) == count


def test_json_output_in_test_environment(capsys: pytest.CaptureFixture[str]) -> None:
    configure_logging(Settings(environment="test"))
    structlog.get_logger("t").info("hello.world", answer=42)
    line = capsys.readouterr().out.strip().splitlines()[-1]
    data = json.loads(line)
    assert data["event"] == "hello.world"
    assert data["answer"] == 42
    assert data["level"] == "info"
    assert "timestamp" in data


def test_stdlib_logs_are_rendered_as_json(capsys: pytest.CaptureFixture[str]) -> None:
    settings = Settings(
        environment="prod",
        secret_key=SecretStr("s" * 40),
        database_url="postgresql+asyncpg://u:p@db/x",
        valkey_url="redis://valkey/0",
    )
    configure_logging(settings)
    logging.getLogger("uvicorn.error").warning("from stdlib")
    data = json.loads(capsys.readouterr().out.strip().splitlines()[-1])
    assert data["event"] == "from stdlib"
    assert data["level"] == "warning"


def test_dev_uses_console_renderer(capsys: pytest.CaptureFixture[str]) -> None:
    configure_logging(Settings(environment="dev"))
    structlog.get_logger("t").info("hello.dev")
    out = capsys.readouterr().out
    assert "hello.dev" in out
    with pytest.raises(json.JSONDecodeError):
        json.loads(out.strip().splitlines()[-1])


def test_log_level_is_respected(capsys: pytest.CaptureFixture[str]) -> None:
    configure_logging(Settings(environment="test", log_level="WARNING"))
    structlog.get_logger("t").info("hidden")
    assert "hidden" not in capsys.readouterr().out
