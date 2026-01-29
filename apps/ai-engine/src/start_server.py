"""Production server following FastAPI deployment best practices.

Based on: https://fastapi.tiangolo.com/deployment/manually/

Features:
- uvloop for better performance (with fallback to asyncio)
- httptools for faster HTTP parsing (with fallback)
- Proper signal handling for graceful shutdown
- Configurable workers, timeouts, and limits via environment variables
"""

from __future__ import annotations

import importlib.util
import logging
import os
import signal
import sys
from pathlib import Path

import uvicorn

# Add parent directory to path so we can import from src
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.main import app

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


from types import FrameType


def handle_signal(signum: int, _frame: FrameType | None) -> None:
    """Handle shutdown signals."""
    logger.info("Received signal %s, shutting down...", signum)
    signal.raise_signal(signal.SIGINT)


def run_server() -> None:
    """Run the production server with optimal settings."""

    # Set up signal handlers BEFORE starting uvicorn
    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    # Try to use uvloop for better performance
    try:
        import uvloop

        uvloop.install()
        logger.info("Using uvloop for better performance")
    except ImportError:
        logger.info("uvloop not available, using default asyncio")

    # Configuration from environment with sensible defaults
    config = uvicorn.Config(
        app,
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        workers=int(os.getenv("WORKERS", "1")),
        log_level=os.getenv("LOG_LEVEL", "info").lower(),
        access_log=os.getenv("ACCESS_LOG", "true").lower() == "true",
        # Timeout settings
        timeout_keep_alive=int(os.getenv("TIMEOUT_KEEP_ALIVE", "5")),
        limit_concurrency=int(os.getenv("LIMIT_CONCURRENCY", "100")),
        limit_max_requests=int(os.getenv("LIMIT_MAX_REQUESTS", "1000")),
        # Use httptools if available for faster HTTP parsing
        http="httptools" if _has_httptools() else "auto",
        loop="uvloop" if _has_uvloop() else "auto",
    )

    server = uvicorn.Server(config)

    # Run the server
    server.run()


def _has_uvloop() -> bool:
    """Check if uvloop is available."""
    return importlib.util.find_spec("uvloop") is not None


def _has_httptools() -> bool:
    """Check if httptools is available."""
    return importlib.util.find_spec("httptools") is not None


if __name__ == "__main__":
    try:
        run_server()
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    finally:
        sys.exit(0)
