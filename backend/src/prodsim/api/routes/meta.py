from fastapi import APIRouter
from pydantic import BaseModel

import prodsim

router = APIRouter(tags=["meta"])


class MetaResponse(BaseModel):
    name: str
    version: str


@router.get("/meta", operation_id="meta_get")
async def get_meta() -> MetaResponse:
    return MetaResponse(name="ProdSim", version=prodsim.__version__)
