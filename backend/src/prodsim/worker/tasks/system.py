# pyright: reportMissingTypeStubs=false, reportUnknownMemberType=false, reportUnknownVariableType=false
# celery ships no type information
"""System-level tasks."""

from celery import shared_task


@shared_task(name="prodsim.system.ping")
def ping() -> str:
    """Liveness probe for the worker: returns "pong"."""
    return "pong"
