from typing import Literal

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/health", tags=["health"])


class LiveResponse(BaseModel):
    status: Literal["ok"]


@router.get("/live", operation_id="health_live")
async def live() -> LiveResponse:
    return LiveResponse(status="ok")
