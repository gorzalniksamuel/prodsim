import httpx

import prodsim


async def test_meta_returns_name_and_version(client: httpx.AsyncClient) -> None:
    response = await client.get("/api/v1/meta")
    assert response.status_code == 200
    assert response.json() == {"name": "ProdSim", "version": prodsim.__version__}


def test_version_is_package_version() -> None:
    assert prodsim.__version__ == "0.1.0.dev0"
