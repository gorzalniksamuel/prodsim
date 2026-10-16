from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

import prodsim
from prodsim.api.routes import health, meta
from prodsim.core.config import Settings, get_settings


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    app = FastAPI(title="ProdSim", version=prodsim.__version__)
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
