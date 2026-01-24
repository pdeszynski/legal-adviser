"""Script to export OpenAPI schema for client generation."""

import json
from pathlib import Path

from main import app


def main():
    """Export OpenAPI schema to JSON file."""
    openapi_schema = app.openapi()

    # Save to file
    output_path = Path(__file__).parent.parent / "openapi.json"
    with open(output_path, "w") as f:
        json.dump(openapi_schema, f, indent=2)

    print(f"OpenAPI schema exported to: {output_path}")


if __name__ == "__main__":
    main()
