import asyncio
from typing import Literal

from fastapi import APIRouter, Request, Response, status
from pydantic import BaseModel

from prodsim.core.health import CheckResult, check_database, check_valkey

router = APIRouter(prefix="/health", tags=["health"])


class LiveResponse(BaseModel):
    status: Literal["ok"]


class CheckModel(BaseModel):
    name: str
    ok: bool
    detail: str | None = None


class ReadyResponse(BaseModel):
    status: Literal["ok", "degraded"]
    checks: list[CheckModel]


@router.get("/live", operation_id="health_live")
async def live() -> LiveResponse:
    return LiveResponse(status="ok")


@router.get(
    "/ready",
    operation_id="health_ready",
    responses={status.HTTP_503_SERVICE_UNAVAILABLE: {"model": ReadyResponse}},
)
async def ready(request: Request, response: Response) -> ReadyResponse:
    state = request.app.state
    results: list[CheckResult] = list(
        await asyncio.gather(check_database(state.engine), check_valkey(state.valkey))
    )
    all_ok = all(r.ok for r in results)
    if not all_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return ReadyResponse(
        status="ok" if all_ok else "degraded",
        checks=[CheckModel(name=r.name, ok=r.ok, detail=r.detail) for r in results],
    )
