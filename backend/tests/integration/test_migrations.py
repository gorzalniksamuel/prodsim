import asyncio
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

pytestmark = pytest.mark.integration

ALEMBIC_INI = Path(__file__).resolve().parents[2] / "alembic.ini"


async def extensions(url: str) -> set[str]:
    engine = create_async_engine(url)
    try:
        async with engine.connect() as conn:
            rows = await conn.execute(text("SELECT extname FROM pg_extension"))
            return {row[0] for row in rows}
    finally:
        await engine.dispose()


# Sync test: alembic's env.py runs its own event loop via asyncio.run.
def test_migration_upgrade_head_enables_timescaledb(
    postgres_url: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("PRODSIM_DATABASE_URL", postgres_url)
    cfg = Config(str(ALEMBIC_INI))

    command.upgrade(cfg, "head")
    assert "timescaledb" in asyncio.run(extensions(postgres_url))

    command.downgrade(cfg, "base")
    assert "timescaledb" not in asyncio.run(extensions(postgres_url))
