# pyright: reportMissingTypeStubs=false, reportUnknownMemberType=false, reportUnknownVariableType=false
# celery ships no type information
"""Celery application on Valkey.

Start a worker with `celery -A prodsim.worker.app:celery_app worker --loglevel=INFO`.
"""

from typing import Any

from celery import Celery
from celery.signals import setup_logging

from prodsim.core.config import Settings, get_settings
from prodsim.core.logging import configure_logging


def create_celery_app(settings: Settings) -> Celery:
    app = Celery("prodsim", broker=settings.valkey_url, backend=settings.valkey_url)
    app.conf.update(
        worker_prefetch_multiplier=1,
        task_acks_late=True,
        task_serializer="json",
        result_serializer="json",
        accept_content=["json"],
        broker_connection_retry_on_startup=True,
        imports=["prodsim.worker.tasks.system"],
    )

    def _setup_logging(**_: Any) -> None:
        # Connecting this signal stops Celery from installing its own log handlers.
        configure_logging(settings)

    # Celery emits setup_logging with sender=None, so no sender filter. The fixed dispatch_uid
    # keeps repeated factory calls from stacking receivers: Celery ignores a connect whose
    # dispatch_uid is already registered, so the FIRST factory call's settings win.
    setup_logging.connect(_setup_logging, weak=False, dispatch_uid="prodsim.configure_logging")
    return app


celery_app = create_celery_app(get_settings())
