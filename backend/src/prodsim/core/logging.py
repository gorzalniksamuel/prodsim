"""Structured logging: structlog on top of stdlib logging.

Every record, whether emitted through structlog or through stdlib `logging` (uvicorn,
sqlalchemy, celery, ...), is rendered by structlog's `ProcessorFormatter`: JSON in
prod/test, a human-friendly console renderer in dev.

Never log the `Settings` object: its repr can include DSN passwords.
"""

import logging
import sys
from typing import Any

import structlog
from structlog.typing import Processor

from prodsim.core.config import Settings

_UVICORN_LOGGERS = ("uvicorn", "uvicorn.error", "uvicorn.access")


class _StdoutHandler(logging.StreamHandler[Any]):
    """Writes to whatever `sys.stdout` is at emit time (keeps output capturable)."""

    def __init__(self) -> None:
        super().__init__(sys.stdout)

    @property
    def stream(self) -> Any:
        return sys.stdout

    @stream.setter
    def stream(self, value: Any) -> None:
        pass


def configure_logging(settings: Settings) -> None:
    """Configure structlog and stdlib logging. Idempotent: safe to call repeatedly."""
    shared: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso", utc=True),
        structlog.stdlib.ExtraAdder(),
    ]
    renderer: Processor = (
        structlog.dev.ConsoleRenderer()
        if settings.environment == "dev"
        else structlog.processors.JSONRenderer()
    )
    exc_processors: list[Processor] = (
        [] if settings.environment == "dev" else [structlog.processors.format_exc_info]
    )

    structlog.configure(
        processors=[
            *shared,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=False,
    )

    handler = _StdoutHandler()
    handler._prodsim = True  # pyright: ignore[reportAttributeAccessIssue]  # noqa: SLF001
    handler.setFormatter(
        structlog.stdlib.ProcessorFormatter(
            foreign_pre_chain=shared,
            processors=[
                structlog.stdlib.ProcessorFormatter.remove_processors_meta,
                *exc_processors,
                renderer,
            ],
        )
    )

    root = logging.getLogger()
    for existing in [h for h in root.handlers if getattr(h, "_prodsim", False)]:
        root.removeHandler(existing)
    root.addHandler(handler)
    root.setLevel(settings.log_level.upper())

    # Route uvicorn through the root handler; http.request replaces its access log.
    for name in _UVICORN_LOGGERS:
        logger = logging.getLogger(name)
        logger.handlers.clear()
        logger.propagate = True
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
