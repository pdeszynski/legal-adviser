"""Script to export OpenAPI schema for client generation."""

import json
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from fastapi import FastAPI

# Lazy import to avoid mypy issues
def _get_app() -> "FastAPI":  # type: ignore[no-any-return]
    from main import app
    return app


def main() -> None:
    """Export OpenAPI schema to JSON file."""
    app = _get_app()
    openapi_schema = app.openapi()

    # Save to file
    output_path = Path(__file__).parent.parent / "openapi.json"
    with output_path.open("w") as f:
        json.dump(openapi_schema, f, indent=2)

    print(f"OpenAPI schema exported to: {output_path}")
