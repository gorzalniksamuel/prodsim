"""Async SQLAlchemy engine and session factory."""

from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from prodsim.core.config import Settings


def create_engine(settings: Settings) -> AsyncEngine:
    """Create the engine. Does not connect: connections are opened on first use."""
    return create_async_engine(settings.database_url, pool_pre_ping=True)


def session_factory(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, expire_on_commit=False)
