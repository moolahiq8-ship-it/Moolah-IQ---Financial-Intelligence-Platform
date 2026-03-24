"""MCP (Model Context Protocol) server modules for Moolah IQ V3.8.2.

Each server is a standalone FastAPI application:
  - mcp_youtube_server   (port 8001) — YouTube Data API v3
  - mcp_comfyui_server   (port 8002) — ComfyUI image/video generation
  - mcp_whisper_server   (port 8003) — faster-whisper transcription
  - mcp_newsletter_server(port 8004) — Beehiiv / ConvertKit newsletters
  - mcp_local_market_server (port 8005) — yfinance + FRED market data
"""
