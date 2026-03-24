#!/usr/bin/env python3
"""Environment setup verification for Moolah IQ V3.8.2 pipeline.

Checks:
  1. Python version >= 3.12
  2. Required environment variables are set
  3. Ollama is running and llama4:16x17b model is available
  4. ComfyUI is reachable
  5. Required Python packages are importable

Usage:
    python scripts/setup_check.py
"""

from __future__ import annotations

import os
import sys

from dotenv import load_dotenv

load_dotenv()

PASS = "PASS"
FAIL = "FAIL"
WARN = "WARN"

results: list[tuple[str, str, str]] = []


def check(name: str, status: str, detail: str = "") -> None:
    results.append((name, status, detail))
    icon = {"PASS": "+", "FAIL": "!", "WARN": "~"}[status]
    print(f"  [{icon}] {name}: {detail}")


def check_python_version() -> None:
    v = sys.version_info
    version_str = f"{v.major}.{v.minor}.{v.micro}"
    if v >= (3, 12):
        check("Python version", PASS, f"{version_str} >= 3.12")
    else:
        check("Python version", FAIL, f"{version_str} < 3.12 — need Python 3.12+")


def check_env_vars() -> None:
    required = [
        ("ANTHROPIC_API_KEY", "Claude Opus 4.6 (content, newsletter, SEO, optimization agents)"),
        ("GEMINI_API_KEY", "Gemini (research agent)"),
        ("YOUTUBE_API_KEY", "YouTube Data API v3"),
    ]
    optional = [
        ("LANGSMITH_API_KEY", "LangSmith tracing (observability)"),
        ("NEWSLETTER_API_KEY", "Newsletter provider (Beehiiv/ConvertKit)"),
        ("POSTIZ_API_KEY", "Postiz social media scheduling"),
        ("FRED_API_KEY", "FRED economic data API"),
        ("OLLAMA_BASE_URL", "Ollama URL (default: http://localhost:11434)"),
        ("COMFYUI_URL", "ComfyUI URL (default: http://localhost:8000)"),
    ]

    for var, desc in required:
        val = os.getenv(var, "")
        if val and not val.endswith("..."):
            check(f"ENV {var}", PASS, f"set ({desc})")
        else:
            check(f"ENV {var}", FAIL, f"MISSING — needed for {desc}")

    for var, desc in optional:
        val = os.getenv(var, "")
        if val and not val.endswith("..."):
            check(f"ENV {var}", PASS, f"set ({desc})")
        else:
            check(f"ENV {var}", WARN, f"not set — {desc}")


def check_ollama() -> None:
    import httpx

    ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    target_model = "llama4:16x17b"

    # Check if Ollama is running
    try:
        resp = httpx.get(f"{ollama_url}/api/tags", timeout=5)
        resp.raise_for_status()
        check("Ollama service", PASS, f"reachable at {ollama_url}")
    except (httpx.ConnectError, httpx.ReadTimeout):
        check("Ollama service", FAIL, f"not reachable at {ollama_url}")
        check(f"Ollama model {target_model}", FAIL, "skipped (Ollama not running)")
        return
    except Exception as exc:
        check("Ollama service", FAIL, f"error: {exc}")
        return

    # Check if the target model is available
    try:
        data = resp.json()
        models = [m.get("name", "") for m in data.get("models", [])]
        # Match by prefix (model names may include :latest or version tags)
        matching = [m for m in models if m.startswith("llama4")]
        if any(target_model in m for m in models):
            check(f"Ollama model {target_model}", PASS, "available")
        elif matching:
            check(f"Ollama model {target_model}", WARN,
                  f"exact match not found, but similar model(s): {', '.join(matching)}")
        else:
            check(f"Ollama model {target_model}", FAIL,
                  f"not found. Available: {', '.join(models[:5]) if models else 'none'}")
    except Exception as exc:
        check(f"Ollama model {target_model}", FAIL, f"error checking models: {exc}")


def check_comfyui() -> None:
    import httpx

    comfyui_url = os.getenv("COMFYUI_URL", "http://localhost:8000")
    try:
        resp = httpx.get(f"{comfyui_url}/system_stats", timeout=5)
        if resp.status_code == 200:
            check("ComfyUI service", PASS, f"reachable at {comfyui_url}")
        else:
            check("ComfyUI service", WARN, f"responded with HTTP {resp.status_code} at {comfyui_url}")
    except httpx.ConnectError:
        check("ComfyUI service", WARN, f"not reachable at {comfyui_url} (needed for production agent)")
    except Exception as exc:
        check("ComfyUI service", WARN, f"error: {exc}")


def check_packages() -> None:
    packages = [
        ("langgraph", "LangGraph orchestrator"),
        ("langchain_core", "LangChain core"),
        ("langchain_anthropic", "Claude API integration"),
        ("langchain_google_genai", "Gemini API integration"),
        ("langchain_ollama", "Ollama integration"),
        ("fastapi", "MCP server framework"),
        ("uvicorn", "ASGI server"),
        ("httpx", "HTTP client"),
        ("yaml", "YAML config parsing (pyyaml)"),
        ("dotenv", "Environment loading (python-dotenv)"),
        ("pydantic", "Data validation"),
    ]

    for pkg, desc in packages:
        try:
            __import__(pkg)
            check(f"Package {pkg}", PASS, desc)
        except ImportError:
            check(f"Package {pkg}", FAIL, f"not installed — needed for {desc}")

    # Optional packages
    optional_pkgs = [
        ("faster_whisper", "Whisper MCP server"),
        ("yfinance", "Market data MCP server"),
    ]
    for pkg, desc in optional_pkgs:
        try:
            __import__(pkg)
            check(f"Package {pkg}", PASS, desc)
        except ImportError:
            check(f"Package {pkg}", WARN, f"not installed — needed for {desc}")


def main() -> None:
    print("=" * 60)
    print("  Moolah IQ V3.8.2 — Environment Setup Check")
    print("=" * 60)
    print()

    print("Python:")
    check_python_version()
    print()

    print("Environment Variables:")
    check_env_vars()
    print()

    print("Python Packages:")
    check_packages()
    print()

    print("Services:")
    check_ollama()
    check_comfyui()
    print()

    # Summary
    passes = sum(1 for _, s, _ in results if s == PASS)
    fails = sum(1 for _, s, _ in results if s == FAIL)
    warns = sum(1 for _, s, _ in results if s == WARN)

    print("=" * 60)
    print(f"  SUMMARY: {passes} passed, {fails} failed, {warns} warnings")
    if fails == 0:
        print("  STATUS:  Ready to run pipeline")
    elif fails <= 3:
        print("  STATUS:  Some required components missing (see FAIL items)")
        print("           Pipeline may work in mock mode: python scripts/dry_run.py")
    else:
        print("  STATUS:  Multiple required components missing")
        print("           Run: pip install -r requirements.txt")
        print("           Then configure .env from .env.example")
    print("=" * 60)

    sys.exit(1 if fails > 0 else 0)


if __name__ == "__main__":
    main()
