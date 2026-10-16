import asyncio
from pathlib import Path

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

pytestmark = pytest.mark.integration

ALEMBIC_INI = Path(__file__).resolve().parents[2] / "alembic.ini"


async def query(url: str, sql: str) -> list[str]:
    engine = create_async_engine(url, isolation_level="AUTOCOMMIT")
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text(sql))
            return [row[0] for row in result] if result.returns_rows else []
    finally:
        await engine.dispose()


EXT_SQL = "SELECT extname FROM pg_extension"


# Sync test: alembic's env.py runs its own event loop via asyncio.run.
def test_migration_upgrade_head_enables_timescaledb(
    postgres_url: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    monkeypatch.setenv("PRODSIM_DATABASE_URL", postgres_url)
    cfg = Config(str(ALEMBIC_INI))
    cfg.attributes["configure_logger"] = False  # keep alembic from rewiring pytest logging

    # The timescale image pre-creates the extension; remove it so upgrade must do the work.
    asyncio.run(query(postgres_url, "DROP EXTENSION IF EXISTS timescaledb"))
    assert "timescaledb" not in asyncio.run(query(postgres_url, EXT_SQL))

    command.upgrade(cfg, "head")
    assert "timescaledb" in asyncio.run(query(postgres_url, EXT_SQL))
    assert asyncio.run(query(postgres_url, "SELECT version_num FROM alembic_version")) == [
        "0001_baseline"
    ]

    command.downgrade(cfg, "base")
    assert "timescaledb" not in asyncio.run(query(postgres_url, EXT_SQL))
