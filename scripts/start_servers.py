#!/usr/bin/env python3
"""Unified startup script for all 5 Moolah IQ MCP servers.

Starts each server as a subprocess, waits for its /health endpoint
to respond, then proceeds to the next. Logs status for each server.

Usage:
    python scripts/start_servers.py
    python scripts/start_servers.py --timeout 30
"""

from __future__ import annotations

import argparse
import signal
import subprocess
import sys
import time

import httpx

SERVERS = [
    {
        "name": "mcp-youtube",
        "module": "src.mcp_servers.mcp_youtube_server",
        "port": 8001,
    },
    {
        "name": "mcp-comfyui",
        "module": "src.mcp_servers.mcp_comfyui_server",
        "port": 8002,
    },
    {
        "name": "mcp-whisper",
        "module": "src.mcp_servers.mcp_whisper_server",
        "port": 8003,
    },
    {
        "name": "mcp-newsletter",
        "module": "src.mcp_servers.mcp_newsletter_server",
        "port": 8004,
    },
    {
        "name": "mcp-local-market",
        "module": "src.mcp_servers.mcp_local_market_server",
        "port": 8005,
    },
]

processes: list[subprocess.Popen] = []


def health_check(port: int, timeout: int = 20) -> bool:
    """Wait for a server's /health endpoint to respond 200."""
    url = f"http://localhost:{port}/health"
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            resp = httpx.get(url, timeout=3)
            if resp.status_code == 200:
                return True
        except (httpx.ConnectError, httpx.ReadTimeout):
            pass
        time.sleep(0.5)
    return False


def start_server(server: dict, timeout: int) -> subprocess.Popen | None:
    """Start a single MCP server and verify its health."""
    name = server["name"]
    module = server["module"]
    port = server["port"]

    print(f"  [{name}] Starting on port {port}...", flush=True)

    proc = subprocess.Popen(
        [sys.executable, "-m", module],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
    )

    if health_check(port, timeout=timeout):
        print(f"  [{name}] HEALTHY (port {port})")
        return proc
    else:
        print(f"  [{name}] FAILED to become healthy within {timeout}s")
        proc.terminate()
        return None


def shutdown_all(signum=None, frame=None) -> None:
    """Gracefully terminate all running server processes."""
    print("\nShutting down all servers...")
    for proc in processes:
        if proc.poll() is None:
            proc.terminate()
    for proc in processes:
        proc.wait(timeout=5)
    print("All servers stopped.")
    sys.exit(0)


def main() -> None:
    parser = argparse.ArgumentParser(description="Start all Moolah IQ MCP servers")
    parser.add_argument("--timeout", type=int, default=20,
                        help="Health check timeout per server in seconds (default: 20)")
    args = parser.parse_args()

    signal.signal(signal.SIGINT, shutdown_all)
    signal.signal(signal.SIGTERM, shutdown_all)

    print("=" * 60)
    print("  Moolah IQ MCP Server Startup")
    print("=" * 60)

    failed = []
    for server in SERVERS:
        proc = start_server(server, timeout=args.timeout)
        if proc:
            processes.append(proc)
        else:
            failed.append(server["name"])

    print()
    print("=" * 60)
    healthy = len(SERVERS) - len(failed)
    print(f"  {healthy}/{len(SERVERS)} servers healthy")
    if failed:
        print(f"  FAILED: {', '.join(failed)}")
    print("=" * 60)

    if failed:
        print("\nSome servers failed to start. Check logs above.")
        shutdown_all()
        sys.exit(1)

    print("\nAll servers running. Press Ctrl+C to stop all.")
    # Keep main process alive
    try:
        while True:
            # Check if any process has died
            for i, proc in enumerate(processes):
                if proc.poll() is not None:
                    name = SERVERS[i]["name"]
                    print(f"\n  WARNING: {name} exited with code {proc.returncode}")
            time.sleep(5)
    except KeyboardInterrupt:
        shutdown_all()


if __name__ == "__main__":
    main()
