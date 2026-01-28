"""Development server with proper signal handling for turbo.

Ensures clean shutdown when turbo sends SIGTERM/SIGINT.
"""

from __future__ import annotations

import logging
import signal
import sys
from pathlib import Path

import uvicorn

# Add parent directory to path so we can import from src
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.main import app

logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Maximum time to wait for graceful shutdown (seconds)
GRACEFUL_SHUTDOWN_TIMEOUT = 5


from types import FrameType

def handle_signal(signum: int, _frame: FrameType | None) -> None:
    """Handle shutdown signals from turbo."""
    logger.info("Received signal %s, shutting down...", signum)
    # Send SIGINT to current process group to ensure all subprocesses exit
    # This is necessary because uvicorn.run() doesn't handle SIGTERM properly
    signal.raise_signal(signal.SIGINT)


def main() -> None:
    """Run the development server with proper signal handling."""
    # Set up signal handlers BEFORE starting uvicorn
    signal.signal(signal.SIGTERM, handle_signal)
    signal.signal(signal.SIGINT, handle_signal)

    # Create uvicorn config
    config = uvicorn.Config(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="debug",
        timeout_keep_alive=5,  # Short timeout for faster shutdown
    )

    server = uvicorn.Server(config)

    # Run the server - this will block until shutdown
    server.run()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    finally:
        # Ensure clean exit
        sys.exit(0)
