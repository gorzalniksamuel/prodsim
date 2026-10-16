"""Write the API's OpenAPI schema to a file (deterministic, sorted keys).

Usage: python -m prodsim.api.openapi_export <path>
"""

import json
import sys
from pathlib import Path

from prodsim.api.app import create_app


def main(argv: list[str] | None = None) -> int:
    args = sys.argv[1:] if argv is None else argv
    if len(args) != 1:
        sys.stderr.write("usage: python -m prodsim.api.openapi_export <path>\n")
        return 2
    # create_app is lazy (no DB/Valkey connection until the lifespan runs).
    schema = create_app().openapi()
    Path(args[0]).write_text(
        json.dumps(schema, indent=2, sort_keys=True, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
