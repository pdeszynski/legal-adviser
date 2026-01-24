"""Development server entry point for AI Engine with hot-reload support."""

import sys

if __name__ == "__main__":
    import logging

    import uvicorn

    # Configure logging for development
    logging.basicConfig(
        level=logging.DEBUG,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    logger = logging.getLogger(__name__)
    logger.info("Starting Legal AI Engine in development mode with hot-reload...")

    sys.argv = [
        "uvicorn",
        "src.main:app",
        "--reload",
        "--port",
        "8000",
        "--log-level",
        "debug",
        "--reload-dir",
        "src",
    ]
    uvicorn.main()
