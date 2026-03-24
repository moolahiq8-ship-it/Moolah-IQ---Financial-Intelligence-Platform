#!/usr/bin/env python3
"""Start the Moolah IQ Pipeline API server.

Usage:
    python scripts/start_api.py
    python scripts/start_api.py --port 9090
    python scripts/start_api.py --reload    # auto-reload on code changes
"""

import argparse
import sys

sys.path.insert(0, ".")

import uvicorn


def main() -> None:
    parser = argparse.ArgumentParser(description="Moolah IQ Pipeline API")
    parser.add_argument("--host", default="0.0.0.0", help="Bind address (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8080, help="Port (default: 8080)")
    parser.add_argument("--reload", action="store_true", help="Auto-reload on code changes")
    args = parser.parse_args()

    uvicorn.run(
        "src.api:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info",
    )


if __name__ == "__main__":
    main()
