from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import redis.asyncio as redis
from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

import prodsim
from prodsim.api.routes import health, meta
from prodsim.core.config import Settings, get_settings
from prodsim.core.db import create_engine


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator[None]:
        # Both are lazy: no connection is made until first use, so the app starts
        # (and liveness answers) even when the database or Valkey is down.
        engine = create_engine(settings)
        valkey = redis.from_url(settings.valkey_url)
        app.state.engine = engine
        app.state.valkey = valkey
        try:
            yield
        finally:
            await valkey.aclose()
            await engine.dispose()

    app = FastAPI(title="ProdSim", version=prodsim.__version__, lifespan=lifespan)
    app.state.settings = settings

    if settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=settings.cors_origins,
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

    api_v1 = APIRouter(prefix="/api/v1")
    api_v1.include_router(health.router)
    api_v1.include_router(meta.router)
    app.include_router(api_v1)
    return app
