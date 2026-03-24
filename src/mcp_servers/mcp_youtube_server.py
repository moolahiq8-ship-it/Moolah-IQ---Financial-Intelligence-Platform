"""MCP YouTube Server — YouTube Data API v3 integration.

FastAPI server on port 8001. Provides tools for video statistics,
trending topic discovery, and channel analytics via the YouTube Data API.
"""

from __future__ import annotations

import logging
import os
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

load_dotenv()

log = logging.getLogger("mcp-youtube")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s %(message)s")

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY", "")
YT_BASE = "https://www.googleapis.com/youtube/v3"

app = FastAPI(title="MCP YouTube Server", version="1.0.0")


# ── Request models ────────────────────────────────────────────────────

class VideoStatsRequest(BaseModel):
    video_id: str


class TrendingTopicsRequest(BaseModel):
    pillar: str
    limit: int = 10


class ChannelAnalyticsRequest(BaseModel):
    days: int = 30


# ── Startup / Health ──────────────────────────────────────────────────

@app.on_event("startup")
async def startup() -> None:
    key_status = "SET" if YOUTUBE_API_KEY else "MISSING"
    log.info("[mcp-youtube] Server starting on port 8001 | YOUTUBE_API_KEY=%s", key_status)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "mcp-youtube", "port": "8001"}


@app.get("/tools")
async def list_tools() -> list[dict[str, Any]]:
    return [
        {
            "name": "get_video_stats",
            "description": "Get view count, likes, comments, and duration for a YouTube video.",
            "parameters": {"video_id": {"type": "string", "required": True}},
        },
        {
            "name": "search_trending_topics",
            "description": "Search YouTube for trending topics related to a Moolah IQ pillar.",
            "parameters": {
                "pillar": {"type": "string", "required": True},
                "limit": {"type": "integer", "default": 10},
            },
        },
        {
            "name": "get_channel_analytics",
            "description": "Get channel-level analytics for the past N days.",
            "parameters": {"days": {"type": "integer", "default": 30}},
        },
    ]


# ── Tool endpoints ────────────────────────────────────────────────────

@app.post("/tools/get_video_stats")
async def get_video_stats(req: VideoStatsRequest) -> dict[str, Any]:
    """Fetch statistics for a single YouTube video."""
    if not YOUTUBE_API_KEY:
        raise HTTPException(status_code=500, detail="YOUTUBE_API_KEY not configured")

    log.info("[mcp-youtube] get_video_stats: %s", req.video_id)
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{YT_BASE}/videos",
                params={
                    "part": "statistics,contentDetails,snippet",
                    "id": req.video_id,
                    "key": YOUTUBE_API_KEY,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        items = data.get("items", [])
        if not items:
            raise HTTPException(status_code=404, detail=f"Video {req.video_id} not found")

        video = items[0]
        stats = video.get("statistics", {})
        snippet = video.get("snippet", {})
        content = video.get("contentDetails", {})

        return {
            "video_id": req.video_id,
            "title": snippet.get("title"),
            "channel": snippet.get("channelTitle"),
            "published_at": snippet.get("publishedAt"),
            "duration": content.get("duration"),
            "view_count": int(stats.get("viewCount", 0)),
            "like_count": int(stats.get("likeCount", 0)),
            "comment_count": int(stats.get("commentCount", 0)),
        }
    except httpx.HTTPStatusError as exc:
        log.error("[mcp-youtube] YouTube API error: %s", exc.response.text)
        raise HTTPException(status_code=exc.response.status_code, detail="YouTube API error") from exc
    except httpx.RequestError as exc:
        log.error("[mcp-youtube] Request failed: %s", exc)
        raise HTTPException(status_code=502, detail="Failed to reach YouTube API") from exc


@app.post("/tools/search_trending_topics")
async def search_trending_topics(req: TrendingTopicsRequest) -> dict[str, Any]:
    """Search YouTube for trending personal-finance topics related to a pillar."""
    if not YOUTUBE_API_KEY:
        raise HTTPException(status_code=500, detail="YOUTUBE_API_KEY not configured")

    log.info("[mcp-youtube] search_trending_topics: pillar=%s limit=%d", req.pillar, req.limit)
    query = f"personal finance {req.pillar.lower()} 2026"

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{YT_BASE}/search",
                params={
                    "part": "snippet",
                    "q": query,
                    "type": "video",
                    "order": "viewCount",
                    "maxResults": min(req.limit, 50),
                    "key": YOUTUBE_API_KEY,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        topics = []
        for item in data.get("items", []):
            snippet = item.get("snippet", {})
            topics.append({
                "video_id": item["id"].get("videoId"),
                "title": snippet.get("title"),
                "channel": snippet.get("channelTitle"),
                "published_at": snippet.get("publishedAt"),
                "description_snippet": (snippet.get("description", ""))[:200],
            })

        return {"pillar": req.pillar, "query": query, "count": len(topics), "topics": topics}
    except httpx.HTTPStatusError as exc:
        log.error("[mcp-youtube] YouTube API error: %s", exc.response.text)
        raise HTTPException(status_code=exc.response.status_code, detail="YouTube API error") from exc
    except httpx.RequestError as exc:
        log.error("[mcp-youtube] Request failed: %s", exc)
        raise HTTPException(status_code=502, detail="Failed to reach YouTube API") from exc


@app.post("/tools/get_channel_analytics")
async def get_channel_analytics(req: ChannelAnalyticsRequest) -> dict[str, Any]:
    """Get channel-level statistics for the past N days.

    Note: The YouTube Data API v3 (free) provides channel stats but not
    time-windowed analytics. For full YouTube Analytics API access, OAuth2
    is required. This endpoint returns current channel totals as a baseline.
    """
    if not YOUTUBE_API_KEY:
        raise HTTPException(status_code=500, detail="YOUTUBE_API_KEY not configured")

    log.info("[mcp-youtube] get_channel_analytics: days=%d", req.days)
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # Get channel stats for the authenticated channel (requires forMine + OAuth)
            # Fallback: use channel ID from env or return instruction
            resp = await client.get(
                f"{YT_BASE}/channels",
                params={
                    "part": "statistics,snippet",
                    "mine": "true",
                    "key": YOUTUBE_API_KEY,
                },
            )
            resp.raise_for_status()
            data = resp.json()

        items = data.get("items", [])
        if not items:
            return {
                "days": req.days,
                "note": "No channel found. Channel analytics requires OAuth2 authentication.",
                "stats": {},
            }

        channel = items[0]
        stats = channel.get("statistics", {})
        return {
            "days": req.days,
            "channel_title": channel.get("snippet", {}).get("title"),
            "subscriber_count": int(stats.get("subscriberCount", 0)),
            "total_views": int(stats.get("viewCount", 0)),
            "video_count": int(stats.get("videoCount", 0)),
            "note": "Current totals via Data API. Time-windowed analytics require YouTube Analytics API + OAuth2.",
        }
    except httpx.HTTPStatusError as exc:
        log.error("[mcp-youtube] YouTube API error: %s", exc.response.text)
        raise HTTPException(status_code=exc.response.status_code, detail="YouTube API error") from exc
    except httpx.RequestError as exc:
        log.error("[mcp-youtube] Request failed: %s", exc)
        raise HTTPException(status_code=502, detail="Failed to reach YouTube API") from exc


# ── Main ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8001)
