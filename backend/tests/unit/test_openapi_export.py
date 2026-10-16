import json
import subprocess
import sys
from pathlib import Path


def _export(path: Path) -> None:
    subprocess.run(  # noqa: S603
        [sys.executable, "-m", "prodsim.api.openapi_export", str(path)],
        check=True,
        capture_output=True,
    )


def test_export_is_deterministic_and_has_ready_route(tmp_path: Path) -> None:
    first, second = tmp_path / "a.json", tmp_path / "b.json"
    _export(first)
    _export(second)
    assert first.read_bytes() == second.read_bytes()
    schema = json.loads(first.read_text())
    assert "/api/v1/health/ready" in schema["paths"]
    assert "/api/v1/meta" in schema["paths"]
