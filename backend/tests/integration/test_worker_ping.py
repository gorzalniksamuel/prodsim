import gc
import logging
from collections.abc import Iterator
from typing import Any

import pytest
from celery import Celery
from celery.app.log import Logging
from celery.contrib.testing.worker import start_worker
from celery.signals import setup_logging, task_postrun

from prodsim.core.config import Settings
from prodsim.worker.app import create_celery_app

pytestmark = pytest.mark.integration


@pytest.fixture
def worker_app(valkey_url: str) -> Iterator[Celery]:
    app = create_celery_app(Settings(environment="test", valkey_url=valkey_url))
    # app.backend is thread-local: the worker thread opens its own Valkey connections,
    # which must be closed explicitly or they leak ResourceWarnings.
    backends: list[Any] = [app.backend]

    def _collect_worker_backend(sender: Any = None, **_: Any) -> None:
        backends.append(sender.backend)

    task_postrun.connect(_collect_worker_backend, weak=False)
    try:
        with start_worker(app, perform_ping_check=False, pool="solo", loglevel="WARNING"):
            yield app
    finally:
        task_postrun.disconnect(_collect_worker_backend)
        gc.collect()  # AsyncResult.__del__ talks to the backend; run it while Valkey is up
        for backend in backends:
            backend.result_consumer.stop()
            backend.client.connection_pool.disconnect()
        app.pool.force_close_all()
        app.close()
        gc.collect()


def test_celery_config(valkey_url: str) -> None:
    app = create_celery_app(Settings(environment="test", valkey_url=valkey_url))
    assert app.conf.broker_url == valkey_url
    assert app.conf.result_backend == valkey_url
    assert app.conf.worker_prefetch_multiplier == 1
    assert app.conf.task_acks_late is True
    assert app.conf.task_serializer == "json"
    assert app.conf.result_serializer == "json"
    assert list(app.conf.accept_content) == ["json"]
    assert app.conf.broker_connection_retry_on_startup is True


def test_ping_task_runs_on_worker(worker_app: Celery) -> None:
    result = worker_app.tasks["prodsim.system.ping"].delay()
    assert result.get(timeout=10) == "pong"


@pytest.fixture
def clean_setup_logging_signal(monkeypatch: pytest.MonkeyPatch) -> Iterator[None]:
    monkeypatch.setattr(Logging, "_setup", False)  # restored after the test
    saved = setup_logging.receivers[:]
    yield
    setup_logging.receivers[:] = saved
    setup_logging.sender_receivers_cache.clear()


@pytest.mark.usefixtures("clean_setup_logging_signal")
def test_celery_logging_setup_uses_prodsim_logging(valkey_url: str) -> None:
    app = create_celery_app(Settings(environment="test", valkey_url=valkey_url))
    create_celery_app(Settings(environment="test", valkey_url=valkey_url))  # no duplicate receivers
    root = logging.getLogger()
    for h in [h for h in root.handlers if getattr(h, "_prodsim", False)]:
        root.removeHandler(h)
    handlers_before = root.handlers[:]
    # Celery's real path: emits setup_logging with sender=None
    app.log.setup_logging_subsystem(loglevel=logging.INFO)
    prodsim = [h for h in root.handlers if getattr(h, "_prodsim", False)]
    assert len(prodsim) == 1
    assert root.handlers == [*handlers_before, *prodsim]  # celery added no handler of its own
    assert len(setup_logging.receivers) == 1
