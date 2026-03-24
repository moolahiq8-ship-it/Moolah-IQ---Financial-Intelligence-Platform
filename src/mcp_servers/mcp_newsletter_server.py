"""MCP Newsletter Server — Email newsletter provider integration.

FastAPI server on port 8004. Provides tools for creating drafts,
scheduling sends, and retrieving stats. Supports Beehiiv (default)
and ConvertKit providers.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

load_dotenv()

log = logging.getLogger("mcp-newsletter")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s %(message)s")

NEWSLETTER_API_KEY = os.getenv("NEWSLETTER_API_KEY", "")
NEWSLETTER_PROVIDER = os.getenv("NEWSLETTER_PROVIDER", "beehiiv").lower()

# Provider base URLs
PROVIDER_URLS = {
    "beehiiv": "https://api.beehiiv.com/v2",
    "convertkit": "https://api.convertkit.com/v4",
}

app = FastAPI(title="MCP Newsletter Server", version="1.0.0")


# ── Request models ────────────────────────────────────────────────────

class CreateDraftRequest(BaseModel):
    subject: str
    body: str
    tags: list[str] = []


class ScheduleSendRequest(BaseModel):
    draft_id: str
    send_time: str  # ISO 8601 datetime string


class GetStatsRequest(BaseModel):
    post_id: str


# ── Provider helpers ──────────────────────────────────────────────────

def _get_headers() -> dict[str, str]:
    """Build auth headers for the configured newsletter provider."""
    if NEWSLETTER_PROVIDER == "beehiiv":
        return {
            "Authorization": f"Bearer {NEWSLETTER_API_KEY}",
            "Content-Type": "application/json",
        }
    elif NEWSLETTER_PROVIDER == "convertkit":
        return {
            "Authorization": f"Bearer {NEWSLETTER_API_KEY}",
            "Content-Type": "application/json",
        }
    return {"Content-Type": "application/json"}


def _get_base_url() -> str:
    """Get the API base URL for the configured provider."""
    url = PROVIDER_URLS.get(NEWSLETTER_PROVIDER)
    if not url:
        raise HTTPException(status_code=500, detail=f"Unsupported provider: {NEWSLETTER_PROVIDER}")
    return url


# ── Startup / Health ──────────────────────────────────────────────────

@app.on_event("startup")
async def startup() -> None:
    key_status = "SET" if NEWSLETTER_API_KEY else "MISSING"
    log.info("[mcp-newsletter] Server starting on port 8004 | provider=%s API_KEY=%s",
             NEWSLETTER_PROVIDER, key_status)


@app.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "mcp-newsletter",
        "port": "8004",
        "provider": NEWSLETTER_PROVIDER,
    }


@app.get("/tools")
async def list_tools() -> list[dict[str, Any]]:
    return [
        {
            "name": "create_draft",
            "description": "Create a newsletter draft with subject, body HTML, and optional tags.",
            "parameters": {
                "subject": {"type": "string", "required": True},
                "body": {"type": "string", "required": True},
                "tags": {"type": "array", "items": {"type": "string"}, "default": []},
            },
        },
        {
            "name": "schedule_send",
            "description": "Schedule a draft for sending at a specific time (ISO 8601).",
            "parameters": {
                "draft_id": {"type": "string", "required": True},
                "send_time": {"type": "string", "required": True, "format": "date-time"},
            },
        },
        {
            "name": "get_stats",
            "description": "Get performance stats (opens, clicks, unsubs) for a sent post.",
            "parameters": {"post_id": {"type": "string", "required": True}},
        },
    ]


# ── Tool endpoints ────────────────────────────────────────────────────

@app.post("/tools/create_draft")
async def create_draft(req: CreateDraftRequest) -> dict[str, Any]:
    """Create a newsletter draft via the configured provider API."""
    if not NEWSLETTER_API_KEY:
        raise HTTPException(status_code=500, detail="NEWSLETTER_API_KEY not configured")

    log.info("[mcp-newsletter] create_draft: subject=%s tags=%s", req.subject, req.tags)

    base_url = _get_base_url()
    headers = _get_headers()

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            if NEWSLETTER_PROVIDER == "beehiiv":
                # Beehiiv requires a publication_id; get from env or list publications
                pub_id = os.getenv("BEEHIIV_PUBLICATION_ID", "")
                if not pub_id:
                    # Auto-discover the first publication
                    pubs_resp = await client.get(f"{base_url}/publications", headers=headers)
                    pubs_resp.raise_for_status()
                    pubs = pubs_resp.json().get("data", [])
                    if not pubs:
                        raise HTTPException(status_code=500, detail="No Beehiiv publications found")
                    pub_id = pubs[0]["id"]

                resp = await client.post(
                    f"{base_url}/publications/{pub_id}/posts",
                    headers=headers,
                    json={
                        "title": req.subject,
                        "subtitle": req.subject,
                        "content": [{"type": "html", "html": req.body}],
                        "status": "draft",
                        "tags": req.tags,
                    },
                )
            elif NEWSLETTER_PROVIDER == "convertkit":
                resp = await client.post(
                    f"{base_url}/broadcasts",
                    headers=headers,
                    json={
                        "subject": req.subject,
                        "content": req.body,
                        "draft": True,
                    },
                )
            else:
                raise HTTPException(status_code=500, detail=f"Unsupported provider: {NEWSLETTER_PROVIDER}")

            resp.raise_for_status()
            data = resp.json()

        # Normalize response
        draft_id = data.get("data", {}).get("id") or data.get("broadcast", {}).get("id") or data.get("id", "unknown")
        return {
            "draft_id": str(draft_id),
            "status": "draft",
            "subject": req.subject,
            "tags": req.tags,
            "provider": NEWSLETTER_PROVIDER,
        }
    except httpx.HTTPStatusError as exc:
        log.error("[mcp-newsletter] API error: %s %s", exc.response.status_code, exc.response.text)
        raise HTTPException(status_code=exc.response.status_code, detail=f"Newsletter API error: {exc.response.text}") from exc
    except httpx.RequestError as exc:
        log.error("[mcp-newsletter] Request failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"Failed to reach {NEWSLETTER_PROVIDER} API") from exc


@app.post("/tools/schedule_send")
async def schedule_send(req: ScheduleSendRequest) -> dict[str, Any]:
    """Schedule a draft for sending at a specific time."""
    if not NEWSLETTER_API_KEY:
        raise HTTPException(status_code=500, detail="NEWSLETTER_API_KEY not configured")

    # Validate the send_time format
    try:
        send_dt = datetime.fromisoformat(req.send_time)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid send_time format: {req.send_time}. Use ISO 8601.")

    log.info("[mcp-newsletter] schedule_send: draft=%s time=%s", req.draft_id, req.send_time)

    base_url = _get_base_url()
    headers = _get_headers()

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            if NEWSLETTER_PROVIDER == "beehiiv":
                pub_id = os.getenv("BEEHIIV_PUBLICATION_ID", "")
                resp = await client.patch(
                    f"{base_url}/publications/{pub_id}/posts/{req.draft_id}",
                    headers=headers,
                    json={
                        "status": "scheduled",
                        "publish_date": send_dt.isoformat(),
                    },
                )
            elif NEWSLETTER_PROVIDER == "convertkit":
                resp = await client.put(
                    f"{base_url}/broadcasts/{req.draft_id}",
                    headers=headers,
                    json={"send_at": send_dt.isoformat()},
                )
            else:
                raise HTTPException(status_code=500, detail=f"Unsupported provider: {NEWSLETTER_PROVIDER}")

            resp.raise_for_status()

        return {
            "draft_id": req.draft_id,
            "status": "scheduled",
            "send_time": send_dt.isoformat(),
            "provider": NEWSLETTER_PROVIDER,
        }
    except httpx.HTTPStatusError as exc:
        log.error("[mcp-newsletter] API error: %s %s", exc.response.status_code, exc.response.text)
        raise HTTPException(status_code=exc.response.status_code, detail=f"Newsletter API error: {exc.response.text}") from exc
    except httpx.RequestError as exc:
        log.error("[mcp-newsletter] Request failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"Failed to reach {NEWSLETTER_PROVIDER} API") from exc


@app.post("/tools/get_stats")
async def get_stats(req: GetStatsRequest) -> dict[str, Any]:
    """Get performance stats for a sent newsletter post."""
    if not NEWSLETTER_API_KEY:
        raise HTTPException(status_code=500, detail="NEWSLETTER_API_KEY not configured")

    log.info("[mcp-newsletter] get_stats: post=%s", req.post_id)

    base_url = _get_base_url()
    headers = _get_headers()

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            if NEWSLETTER_PROVIDER == "beehiiv":
                pub_id = os.getenv("BEEHIIV_PUBLICATION_ID", "")
                resp = await client.get(
                    f"{base_url}/publications/{pub_id}/posts/{req.post_id}",
                    headers=headers,
                    params={"expand[]": "stats"},
                )
            elif NEWSLETTER_PROVIDER == "convertkit":
                resp = await client.get(
                    f"{base_url}/broadcasts/{req.post_id}/stats",
                    headers=headers,
                )
            else:
                raise HTTPException(status_code=500, detail=f"Unsupported provider: {NEWSLETTER_PROVIDER}")

            resp.raise_for_status()
            data = resp.json()

        # Normalize stats across providers
        if NEWSLETTER_PROVIDER == "beehiiv":
            post_data = data.get("data", {})
            stats = post_data.get("stats", {})
            return {
                "post_id": req.post_id,
                "subject": post_data.get("title", ""),
                "status": post_data.get("status", ""),
                "sent_at": post_data.get("publish_date", ""),
                "recipients": stats.get("email_sent_count", 0),
                "opens": stats.get("email_open_count", 0),
                "open_rate": stats.get("email_open_rate", 0.0),
                "clicks": stats.get("email_click_count", 0),
                "click_rate": stats.get("email_click_rate", 0.0),
                "unsubscribes": stats.get("unsubscribe_count", 0),
                "provider": NEWSLETTER_PROVIDER,
            }
        elif NEWSLETTER_PROVIDER == "convertkit":
            stats = data.get("broadcast", data)
            return {
                "post_id": req.post_id,
                "subject": stats.get("subject", ""),
                "status": stats.get("status", ""),
                "sent_at": stats.get("sent_at", ""),
                "recipients": stats.get("recipients", 0),
                "opens": stats.get("open_count", 0),
                "open_rate": stats.get("open_rate", 0.0),
                "clicks": stats.get("click_count", 0),
                "click_rate": stats.get("click_rate", 0.0),
                "unsubscribes": stats.get("unsubscribe_count", 0),
                "provider": NEWSLETTER_PROVIDER,
            }

        return {"post_id": req.post_id, "raw": data, "provider": NEWSLETTER_PROVIDER}
    except httpx.HTTPStatusError as exc:
        log.error("[mcp-newsletter] API error: %s %s", exc.response.status_code, exc.response.text)
        raise HTTPException(status_code=exc.response.status_code, detail=f"Newsletter API error: {exc.response.text}") from exc
    except httpx.RequestError as exc:
        log.error("[mcp-newsletter] Request failed: %s", exc)
        raise HTTPException(status_code=502, detail=f"Failed to reach {NEWSLETTER_PROVIDER} API") from exc


# ── Main ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8004)
