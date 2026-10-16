"""Dependency readiness checks. Details never include URLs or credentials."""

import asyncio
from dataclasses import dataclass

from redis.asyncio import Redis
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine


@dataclass(frozen=True)
class CheckResult:
    name: str
    ok: bool
    detail: str | None = None


def _describe(exc: BaseException) -> str:
    # Class name only: driver messages can embed DSNs or hostnames.
    return type(exc).__name__


async def check_database(engine: AsyncEngine, timeout_s: float = 2.0) -> CheckResult:
    async def probe() -> None:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))

    try:
        await asyncio.wait_for(probe(), timeout=timeout_s)
    except TimeoutError:
        return CheckResult("database", False, f"timeout after {timeout_s}s")
    except Exception as exc:  # any failure means not ready
        return CheckResult("database", False, _describe(exc))
    return CheckResult("database", True)


async def check_valkey(client: Redis, timeout_s: float = 2.0) -> CheckResult:
    try:
        await asyncio.wait_for(client.ping(), timeout=timeout_s)  # pyright: ignore[reportUnknownMemberType]
    except TimeoutError:
        return CheckResult("valkey", False, f"timeout after {timeout_s}s")
    except Exception as exc:  # any failure means not ready
        return CheckResult("valkey", False, _describe(exc))
    return CheckResult("valkey", True)
