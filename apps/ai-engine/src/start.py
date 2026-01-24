"""Production server entry point for AI Engine with graceful shutdown support."""

import sys

if __name__ == "__main__":
    import logging

    import uvicorn

    # Configure logging for production
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    logger = logging.getLogger(__name__)
    logger.info("Starting Legal AI Engine in production mode...")

    sys.argv = [
        "uvicorn",
        "src.main:app",
        "--host",
        "0.0.0.0",
        "--port",
        "8000",
        "--workers",
        "1",
        "--log-level",
        "info",
    ]
    uvicorn.main()
