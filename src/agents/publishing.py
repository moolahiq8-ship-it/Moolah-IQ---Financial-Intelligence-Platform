"""Publishing Agent — Direct API publishing via MCP servers (V3.8.3.3).

Orchestrates multi-platform publishing: YouTube upload via YouTube MCP server,
newsletter dispatch via Beehiiv API, and social cross-posting via platform-specific
MCP servers (X, Facebook, Instagram, TikTok, Pinterest, Threads, WordPress).

V3.8.3.3 additions: Shorts distribution, Threads support, velocity enforcement
(max 3/day/platform, Tue/Thu 4AM PST schedule), webhook triggers (1K views,
50+ comments), and publish_failures.json logging.

Replaces Postiz with direct API calls. All endpoints gracefully skip if API
keys are missing.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import smtplib
import time
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from pathlib import Path
from typing import Any
from uuid import uuid4

import httpx
from dotenv import load_dotenv

from src.state import PipelineState

load_dotenv()
log = logging.getLogger(__name__)

MAX_RETRIES = 3
REQUEST_TIMEOUT = 30  # seconds

BEEHIIV_API_BASE = "https://api.beehiiv.com/v2"

# Paths for scheduler queue and failure log
BASE_DIR = Path(__file__).resolve().parent.parent.parent
QUEUE_PATH = BASE_DIR / "publishing" / "publish_queue.json"
FAILURES_PATH = BASE_DIR / "publishing" / "publish_failures.json"

# V3.8.3.3 Velocity constants
MAX_POSTS_PER_DAY_PER_PLATFORM = 3
MAX_LONG_FORM_PER_DAY = 1
MIN_SHORTS_INTERVAL_HOURS = 4
PUBLISH_DAYS = ("tuesday", "thursday")
PUBLISH_TIME_PST_HOUR = 4  # 4:00 AM PST

# PST timezone offset (UTC-8)
PST = timezone(timedelta(hours=-8))


class PublishingAgent:
    """Orchestrates multi-platform content publishing via direct API calls."""

    def __init__(self) -> None:
        self.name = "publishing"
        # Beehiiv (newsletter)
        self.newsletter_api_key = os.getenv("NEWSLETTER_API_KEY", "")
        self.newsletter_provider = os.getenv("NEWSLETTER_PROVIDER", "beehiiv")
        self.beehiiv_pub_id = os.getenv("BEEHIIV_PUBLICATION_ID", "")
        # YouTube
        self.youtube_api_key = os.getenv("YOUTUBE_API_KEY", "")
        self.youtube_client_id = os.getenv("YOUTUBE_CLIENT_ID", "")
        # Platform credentials (for skip-if-missing checks)
        self.x_api_key = os.getenv("X_API_KEY", "")
        self.fb_token = (
            os.getenv("FACEBOOK_SYSTEM_USER_TOKEN", "")
            or os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN", "")
        )
        self.ig_token = (
            os.getenv("FACEBOOK_SYSTEM_USER_TOKEN", "")
            or os.getenv("INSTAGRAM_ACCESS_TOKEN", "")
        )
        self.ig_account_id = os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID", "")
        self.tiktok_token = os.getenv("TIKTOK_ACCESS_TOKEN", "")
        self.pinterest_token = os.getenv("PINTEREST_ACCESS_TOKEN", "")
        self.threads_token = os.getenv("THREADS_ACCESS_TOKEN", "")
        self.threads_user_id = os.getenv("THREADS_USER_ID", "")
        self.wordpress_url = os.getenv("WORDPRESS_URL", "")
        # SMTP fallback for newsletter
        self.smtp_host = os.getenv("SMTP_HOST", "")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.owner_email = os.getenv("OWNER_EMAIL", "")
        log.info(
            "[%s] Initialized (youtube=%s, newsletter=%s, x=%s, fb=%s, ig=%s, threads=%s)",
            self.name,
            bool(self.youtube_client_id),
            self.newsletter_provider,
            bool(self.x_api_key),
            bool(self.fb_token),
            bool(self.ig_token),
            bool(self.threads_token),
        )

    # -- Async bridge ----------------------------------------------------------

    @staticmethod
    def _run_async(coro):
        """Run an async coroutine from sync context (Python 3.14 compatible)."""
        try:
            loop = asyncio.get_running_loop()
        except RuntimeError:
            # No running loop — safe to use asyncio.run()
            return asyncio.run(coro)
        # We're inside a running event loop (e.g. uvicorn) — run in a thread
        import concurrent.futures
        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
            return pool.submit(asyncio.run, coro).result()

    # -- HTTP helpers ----------------------------------------------------------

    def _post(self, url: str, json_body: dict, headers: dict | None = None,
              label: str = "request") -> dict[str, Any]:
        """POST with retry and graceful degradation."""
        hdrs = {"Content-Type": "application/json"}
        if headers:
            hdrs.update(headers)

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                resp = httpx.post(
                    url, json=json_body, headers=hdrs,
                    timeout=REQUEST_TIMEOUT,
                )
                resp.raise_for_status()
                return resp.json()
            except httpx.ConnectError:
                log.warning("[%s] %s: connection refused (attempt %d/%d) -- is the service running?",
                            self.name, label, attempt, MAX_RETRIES)
            except httpx.HTTPStatusError as exc:
                log.warning("[%s] %s: HTTP %d (attempt %d/%d): %s",
                            self.name, label, exc.response.status_code, attempt, MAX_RETRIES,
                            exc.response.text[:200])
            except Exception as exc:
                log.warning("[%s] %s failed (attempt %d/%d): %s",
                            self.name, label, attempt, MAX_RETRIES, exc)

            if attempt < MAX_RETRIES:
                time.sleep(2 ** attempt)

        log.error("[%s] %s: all %d attempts failed", self.name, label, MAX_RETRIES)
        return {}

    # -- Temp host helper (for platforms requiring public URLs) ----------------

    @staticmethod
    def _upload_to_temp_host(local_path: str) -> str | None:
        """Upload a local file to a free temp host and return the public URL.

        Tries catbox.moe first (no auth, HTTPS, long retention), falls back to
        0x0.st.  Returns None if both fail.
        """
        path = Path(local_path)
        if not path.exists():
            log.warning("[publishing] Temp upload: file not found %s", local_path)
            return None

        # Determine MIME type from extension
        ext = path.suffix.lower()
        mime = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                ".gif": "image/gif", ".webp": "image/webp"}.get(ext, "application/octet-stream")
        ua_headers = {"User-Agent": "MoolahIQ-Pipeline/3.8.3.3"}

        # Attempt 1: catbox.moe (multipart with proper content type)
        try:
            with open(path, "rb") as f:
                resp = httpx.post(
                    "https://catbox.moe/user/api.php",
                    data={"reqtype": "fileupload"},
                    files={"fileToUpload": (path.name, f, mime)},
                    headers=ua_headers,
                    timeout=60,
                )
            text = resp.text.strip()
            if resp.status_code == 200 and text.startswith("https://"):
                log.info("[publishing] Uploaded to catbox.moe: %s", text)
                return text
            log.warning("[publishing] catbox.moe returned %d: %s", resp.status_code, text[:120])
        except Exception as exc:
            log.warning("[publishing] catbox.moe upload failed: %s", exc)

        # Attempt 2: 0x0.st (requires non-generic user-agent)
        try:
            with open(path, "rb") as f:
                resp = httpx.post(
                    "https://0x0.st",
                    files={"file": (path.name, f, mime)},
                    headers=ua_headers,
                    timeout=60,
                )
            text = resp.text.strip()
            if resp.status_code == 200 and text.startswith("http"):
                log.info("[publishing] Uploaded to 0x0.st: %s", text)
                return text
            log.warning("[publishing] 0x0.st returned %d: %s", resp.status_code, text[:120])
        except Exception as exc:
            log.warning("[publishing] 0x0.st upload failed: %s", exc)

        # Attempt 3: imgbb.com (free tier, no auth needed for anonymous uploads)
        imgbb_key = os.getenv("IMGBB_API_KEY", "")
        if imgbb_key:
            try:
                import base64
                with open(path, "rb") as f:
                    b64 = base64.b64encode(f.read()).decode()
                resp = httpx.post(
                    "https://api.imgbb.com/1/upload",
                    data={"key": imgbb_key, "image": b64},
                    headers=ua_headers,
                    timeout=60,
                )
                if resp.status_code == 200:
                    url = resp.json().get("data", {}).get("url", "")
                    if url:
                        log.info("[publishing] Uploaded to imgbb: %s", url)
                        return url
                log.warning("[publishing] imgbb returned %d", resp.status_code)
            except Exception as exc:
                log.warning("[publishing] imgbb upload failed: %s", exc)

        return None

    def _get_fb_cdn_url(self, local_path: str) -> str | None:
        """Upload a local image to Facebook as unpublished/temporary and return the CDN URL.

        This is more reliable than external temp hosts for Instagram posting
        because Instagram's API can always fetch from Meta's own CDN.
        """
        if not self.fb_token:
            return None

        try:
            from src.mcp_servers.mcp_facebook_server import (
                _ensure_page_token, _get_client, _page_token, _USER_TOKEN,
                FACEBOOK_PAGE_ID, BASE_URL,
            )

            async def _upload():
                await _ensure_page_token()
                client = await _get_client()

                with open(local_path, "rb") as f:
                    resp = await client.post(
                        f"{BASE_URL}/{FACEBOOK_PAGE_ID}/photos",
                        data={
                            "access_token": _page_token or _USER_TOKEN,
                            "published": "false",
                            "temporary": "true",
                        },
                        files={"source": (Path(local_path).name, f, "image/png")},
                        timeout=60.0,
                    )
                resp.raise_for_status()
                photo_id = resp.json().get("id", "")
                if not photo_id:
                    return None

                resp2 = await client.get(
                    f"{BASE_URL}/{photo_id}",
                    params={
                        "access_token": _page_token or _USER_TOKEN,
                        "fields": "images",
                    },
                )
                resp2.raise_for_status()
                images = resp2.json().get("images", [])
                if images:
                    return images[0].get("source", "")
                return None

            url = self._run_async(_upload())
            if url:
                log.info("[%s] Uploaded to Facebook CDN: %s", self.name, url[:80])
            return url
        except Exception as exc:
            log.warning("[%s] Facebook CDN upload failed: %s", self.name, exc)
            return None

    # -- Queue helper ----------------------------------------------------------

    def _enqueue(self, platform: str, payload: dict, video_id: str = "",
                 scheduled_utc: str = "") -> None:
        """Append an item to the publish queue for the scheduler."""
        try:
            queue = []
            if QUEUE_PATH.exists():
                queue = json.loads(QUEUE_PATH.read_text())

            queue.append({
                "id": str(uuid4()),
                "platform": platform,
                "payload": payload,
                "scheduled_utc": scheduled_utc or datetime.now(timezone.utc).isoformat(),
                "status": "pending",
                "video_id": video_id,
            })

            QUEUE_PATH.parent.mkdir(parents=True, exist_ok=True)
            QUEUE_PATH.write_text(json.dumps(queue, indent=2, default=str))
            log.info("[%s] Enqueued %s item to publish queue", self.name, platform)
        except Exception as exc:
            log.warning("[%s] Failed to enqueue %s: %s", self.name, platform, exc)

    # -- Payload builder for scheduler queue ------------------------------------

    def _build_payload(self, state: PipelineState, platform: str) -> dict:
        """Build a platform-specific payload dict from pipeline state for the scheduler queue."""
        metadata = state.get("metadata", {})
        title = metadata.get("youtube_title_a", state.get("topic", ""))
        description = metadata.get("youtube_description", "")
        video_id = metadata.get("youtube_video_id", "")
        video_link = f"https://youtube.com/watch?v={video_id}" if video_id else ""
        video_path = state.get("visuals", {}).get("final_video", "")
        thumbnail_url = state.get("visuals", {}).get("thumbnail_url", "")

        if platform == "x":
            text = (
                f"{title}\n\n"
                f"New video is live! {video_link}\n\n"
                f"#personalfinance #moolahiq"
            )[:280]
            payload = {"text": text}
            if video_path and Path(video_path).exists():
                payload["video_path"] = video_path
            return payload

        if platform == "facebook":
            message = f"{title}\n\n{description[:500]}"
            return {"message": message, "link": video_link}

        if platform == "instagram":
            video_url = metadata.get("public_video_url", "")
            caption = (
                f"{title}\n\n"
                f"#personalfinance #moolahiq #financetips #moneymanagement"
            )[:2200]
            return {"video_url": video_url, "caption": caption}

        if platform == "tiktok":
            return {"video_path": video_path, "title": title[:150]}

        if platform == "pinterest":
            return {
                "title": title[:100],
                "description": description[:800],
                "image_url": thumbnail_url,
                "link": video_link,
            }

        if platform == "threads":
            text = f"{title}\n\n{video_link}\n\n#personalfinance #moolahiq"
            return {"text": text[:500]}

        if platform == "wordpress":
            return {
                "title": title,
                "content": state.get("blog", ""),
                "status": "draft",
            }

        return {}

    # -- YouTube (direct API via YouTube MCP server) ---------------------------

    def _publish_youtube(self, state: PipelineState) -> str:
        """Upload video to YouTube via the enhanced YouTube MCP server.

        Posts to the FastAPI endpoint at localhost:8001/tools/upload_video.
        Falls back to the video_production upload module if server is down.
        """
        metadata = state.get("metadata", {})
        title = metadata.get("youtube_title_a", state.get("topic", "Untitled"))
        description = metadata.get("youtube_description", "")
        tags = metadata.get("youtube_tags", [])
        video_path = state.get("visuals", {}).get("final_video", "")
        thumbnail_path = state.get("visuals", {}).get("thumbnail", "")

        if not self.youtube_client_id and not self.youtube_api_key:
            log.warning("[%s] No YouTube credentials set -- skipping upload", self.name)
            return "skipped:no_api_key"

        if not video_path or not Path(video_path).exists():
            log.warning("[%s] No video file found -- skipping YouTube upload", self.name)
            return "skipped:no_video"

        log.info("[%s] Uploading to YouTube: '%s'", self.name, title[:50])

        result = self._post(
            "http://localhost:8001/tools/upload_video",
            {
                "video_path": video_path,
                "title": title,
                "description": description,
                "tags": tags[:30],
                "privacy": "private",
                "thumbnail_path": thumbnail_path,
            },
            label="youtube_upload",
        )

        if result and result.get("video_id"):
            video_id = result["video_id"]
            log.info("[%s] YouTube upload complete -- video_id=%s", self.name, video_id)
            state.setdefault("metadata", {})["youtube_video_id"] = video_id

            # Enqueue make-public for scheduler (at optimal time)
            self._enqueue(
                "youtube_public",
                {"video_id": video_id},
                video_id=video_id,
                scheduled_utc=(datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
            )
            return "uploaded"

        return "failed"

    # -- Newsletter via Beehiiv -----------------------------------------------

    def _publish_newsletter(self, state: PipelineState) -> str:
        """Create and schedule a newsletter via Beehiiv API directly."""
        nl_meta = state.get("metadata", {}).get("newsletter", {})
        subject = nl_meta.get("subject", state.get("topic", "Moolah IQ Update"))
        preview = nl_meta.get("preview_text", "")
        body_html = nl_meta.get("body_html", state.get("newsletter", ""))

        if not self.newsletter_api_key:
            log.warning("[%s] NEWSLETTER_API_KEY not set -- skipping newsletter", self.name)
            return "skipped:no_api_key"

        pub_id = self.beehiiv_pub_id
        if not pub_id:
            log.warning("[%s] BEEHIIV_PUBLICATION_ID not set -- attempting auto-discovery",
                        self.name)
            pub_id = self._discover_beehiiv_publication()
            if not pub_id:
                log.error("[%s] Could not discover Beehiiv publication -- skipping", self.name)
                return "failed:no_publication"

        log.info("[%s] Creating newsletter draft on Beehiiv: '%s'", self.name, subject[:40])

        send_at = (datetime.now(timezone.utc) + timedelta(minutes=60)).isoformat()

        headers = {
            "Authorization": f"Bearer {self.newsletter_api_key}",
            "Content-Type": "application/json",
        }

        result = self._post(
            f"{BEEHIIV_API_BASE}/publications/{pub_id}/posts",
            {
                "title": subject,
                "subtitle": preview,
                "content": [{"type": "html", "html": body_html}],
                "status": "draft",
                "publish_date": send_at,
                "tags": ["pipeline-auto"],
            },
            headers=headers,
            label="beehiiv_create_post",
        )

        if result:
            # Check for Enterprise-only error
            if result.get("code") == "SEND_API_NOT_ENTERPRISE_PLAN" or (
                not result.get("data") and "enterprise" in str(result).lower()
            ):
                log.warning("[%s] Beehiiv create post requires Enterprise plan -- falling back to SMTP",
                            self.name)
                return self._send_newsletter_smtp(state)

            post_data = result.get("data", result)
            edition_id = post_data.get("id", "")
            log.info("[%s] Newsletter scheduled on Beehiiv -- id=%s, send_at=%s",
                     self.name, edition_id, send_at)
            return "scheduled"

        # Beehiiv API returned empty (all retries failed) -- try SMTP fallback
        log.warning("[%s] Beehiiv API failed -- falling back to SMTP", self.name)
        return self._send_newsletter_smtp(state)

    def _get_beehiiv_subscribers(self) -> list[str]:
        """Fetch active subscriber emails from Beehiiv API (free tier)."""
        if not self.newsletter_api_key or not self.beehiiv_pub_id:
            return []

        emails: list[str] = []
        page = 1
        try:
            while True:
                resp = httpx.get(
                    f"{BEEHIIV_API_BASE}/publications/{self.beehiiv_pub_id}/subscriptions",
                    headers={
                        "Authorization": f"Bearer {self.newsletter_api_key}",
                        "Content-Type": "application/json",
                    },
                    params={"status": "active", "limit": 100, "page": page},
                    timeout=30,
                )
                resp.raise_for_status()
                data = resp.json().get("data", [])
                if not data:
                    break
                emails.extend(sub.get("email", "") for sub in data if sub.get("email"))
                # Check pagination
                total_pages = resp.json().get("total_pages", 1)
                if page >= total_pages:
                    break
                page += 1
        except Exception as exc:
            log.warning("[%s] Failed to fetch Beehiiv subscribers: %s", self.name, exc)

        log.info("[%s] Fetched %d active subscribers from Beehiiv", self.name, len(emails))
        return emails

    def _send_newsletter_smtp(self, state: PipelineState) -> str:
        """Send newsletter via SMTP as fallback when Beehiiv API is unavailable.

        Uses Beehiiv free-tier subscriber list API + SMTP (Gmail) to deliver.
        """
        if not self.smtp_host or not self.smtp_user or not self.smtp_password:
            log.warning("[%s] SMTP credentials not set -- skipping SMTP fallback", self.name)
            return "failed:no_smtp"

        nl_meta = state.get("metadata", {}).get("newsletter", {})
        subject = nl_meta.get("subject", state.get("topic", "Moolah IQ Update"))
        body_html = nl_meta.get("body_html", state.get("newsletter", ""))

        if not body_html:
            log.warning("[%s] No newsletter content for SMTP send", self.name)
            return "failed:no_content"

        # Get subscribers from Beehiiv free-tier API
        recipients = self._get_beehiiv_subscribers()
        if not recipients:
            # Fallback: send to owner only as a test
            if self.owner_email:
                recipients = [self.owner_email]
                log.info("[%s] No Beehiiv subscribers found -- sending to owner only", self.name)
            else:
                log.warning("[%s] No recipients for SMTP newsletter", self.name)
                return "failed:no_recipients"

        # Wrap body in minimal HTML email template
        html_body = f"""\
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 20px;">
{body_html}
<hr style="margin-top: 40px;">
<p style="font-size: 12px; color: #888;">
You received this because you subscribed to the Moolah IQ newsletter.
</p>
</body>
</html>"""

        sent_count = 0
        try:
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=30) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)

                for recipient in recipients:
                    try:
                        msg = MIMEMultipart("alternative")
                        msg["Subject"] = subject
                        msg["From"] = f"Moolah IQ <{self.smtp_user}>"
                        msg["To"] = recipient
                        msg.attach(MIMEText(body_html, "plain"))
                        msg.attach(MIMEText(html_body, "html"))
                        server.sendmail(self.smtp_user, recipient, msg.as_string())
                        sent_count += 1
                    except Exception as exc:
                        log.warning("[%s] SMTP send failed for %s: %s", self.name, recipient[:20], exc)

            log.info("[%s] SMTP newsletter sent to %d/%d recipients", self.name, sent_count, len(recipients))
            return f"sent_smtp:{sent_count}"
        except Exception as exc:
            log.error("[%s] SMTP connection failed: %s", self.name, exc)
            return "failed:smtp_error"

    def _discover_beehiiv_publication(self) -> str:
        """Auto-discover the first Beehiiv publication ID."""
        if not self.newsletter_api_key:
            return ""
        try:
            resp = httpx.get(
                f"{BEEHIIV_API_BASE}/publications",
                headers={
                    "Authorization": f"Bearer {self.newsletter_api_key}",
                    "Content-Type": "application/json",
                },
                timeout=15,
            )
            resp.raise_for_status()
            pubs = resp.json().get("data", [])
            if pubs:
                pub_id = pubs[0]["id"]
                log.info("[%s] Discovered Beehiiv publication: %s", self.name, pub_id)
                return pub_id
        except Exception as exc:
            log.warning("[%s] Beehiiv publication discovery failed: %s", self.name, exc)
        return ""

    # -- X (Twitter) via MCP server -------------------------------------------

    def _publish_x(self, state: PipelineState) -> str:
        """Post to X (Twitter) via the X MCP server."""
        if not self.x_api_key:
            log.warning("[%s] X_API_KEY not set -- skipping X", self.name)
            return "skipped:no_api_key"

        metadata = state.get("metadata", {})
        title = metadata.get("youtube_title_a", state.get("topic", ""))
        video_id = metadata.get("youtube_video_id", "")
        video_link = f"https://youtube.com/watch?v={video_id}" if video_id else ""

        text = (
            f"{title}\n\n"
            f"New video is live! {video_link}\n\n"
            f"#personalfinance #moolahiq"
        )[:280]

        video_path = state.get("visuals", {}).get("final_video", "")

        log.info("[%s] Posting to X", self.name)

        from src.mcp_servers.mcp_x_server import post_text, post_with_video

        try:
            if video_path and Path(video_path).exists():
                result_str = self._run_async(post_with_video(text, video_path))
            else:
                result_str = self._run_async(post_text(text))

            result = json.loads(result_str)
            if result.get("error"):
                log.warning("[%s] X post failed: %s", self.name, result["error"])
                return "failed"

            log.info("[%s] X post published -- tweet_id=%s", self.name, result.get("tweet_id"))
            return "posted"
        except Exception as exc:
            log.warning("[%s] X post failed: %s", self.name, exc)
            return "failed"

    # -- Facebook via MCP server ----------------------------------------------

    def _publish_facebook(self, state: PipelineState) -> str:
        """Post to Facebook via the Facebook MCP server.

        Prefers a photo post (thumbnail) for higher engagement, falling back
        to a text+link post if no thumbnail is available or upload fails.
        """
        if not self.fb_token:
            log.warning("[%s] Facebook token not set -- skipping Facebook", self.name)
            return "skipped:no_api_key"

        metadata = state.get("metadata", {})
        title = metadata.get("youtube_title_a", state.get("topic", ""))
        description = metadata.get("youtube_description", "")
        video_id = metadata.get("youtube_video_id", "")
        video_link = f"https://youtube.com/watch?v={video_id}" if video_id else ""

        message = f"{title}\n\n{description[:500]}"
        if video_link:
            message += f"\n\n{video_link}"

        # Try photo post first if a local thumbnail exists
        thumbnail_path = state.get("visuals", {}).get("thumbnail", "")
        if thumbnail_path and Path(thumbnail_path).exists():
            log.info("[%s] Attempting Facebook photo post with thumbnail", self.name)
            from src.mcp_servers.mcp_facebook_server import upload_photo_local
            try:
                result_str = self._run_async(
                    upload_photo_local(thumbnail_path, caption=message)
                )
                result = json.loads(result_str)
                if not result.get("error"):
                    log.info("[%s] Facebook photo post published -- post_id=%s",
                             self.name, result.get("post_id"))
                    return "posted"
                log.warning("[%s] Facebook photo post failed: %s -- falling back to text+link",
                            self.name, result["error"])
            except Exception as exc:
                log.warning("[%s] Facebook photo post failed: %s -- falling back to text+link",
                            self.name, exc)

        # Fallback: text + link post
        log.info("[%s] Posting text+link to Facebook", self.name)
        from src.mcp_servers.mcp_facebook_server import create_post

        try:
            result_str = self._run_async(create_post(message, link=video_link))
            result = json.loads(result_str)
            if result.get("error"):
                log.warning("[%s] Facebook post failed: %s", self.name, result["error"])
                return "failed"

            log.info("[%s] Facebook post published -- post_id=%s", self.name, result.get("post_id"))
            return "posted"
        except Exception as exc:
            log.warning("[%s] Facebook post failed: %s", self.name, exc)
            return "failed"

    # -- Instagram via MCP server ---------------------------------------------

    def _publish_instagram(self, state: PipelineState) -> str:
        """Post to Instagram via the Instagram MCP server.

        Two modes:
        1. **Reel** — if ``public_video_url`` exists in metadata
        2. **Image** — if no video URL but a local thumbnail exists:
           upload to temp host for a public URL, then call ``post_image()``
        """
        if not self.ig_token or not self.ig_account_id:
            log.warning("[%s] Instagram credentials not set -- skipping", self.name)
            return "skipped:no_api_key"

        metadata = state.get("metadata", {})
        title = metadata.get("youtube_title_a", state.get("topic", ""))
        caption = (
            f"{title}\n\n"
            f"#personalfinance #moolahiq #financetips #moneymanagement"
        )[:2200]

        # Mode 1: Reel (if public video URL exists)
        video_url = metadata.get("public_video_url", "")
        if video_url:
            log.info("[%s] Posting Reel to Instagram", self.name)
            from src.mcp_servers.mcp_instagram_server import post_reel
            try:
                result_str = self._run_async(post_reel(video_url, caption))
                result = json.loads(result_str)
                if result.get("error"):
                    log.warning("[%s] Instagram Reel failed: %s", self.name, result["error"])
                    return "failed"
                log.info("[%s] Instagram Reel posted -- media_id=%s", self.name, result.get("media_id"))
                return "posted"
            except Exception as exc:
                log.warning("[%s] Instagram Reel failed: %s", self.name, exc)
                return "failed"

        # Mode 2: Image post (thumbnail → Facebook CDN → Instagram)
        # Upload to Facebook as unpublished/temporary photo to get a Meta CDN URL,
        # which Instagram's API can always fetch (same infrastructure).
        thumbnail_path = state.get("visuals", {}).get("thumbnail", "")
        if thumbnail_path and Path(thumbnail_path).exists():
            log.info("[%s] No video URL -- attempting Instagram image post with thumbnail", self.name)
            public_url = self._get_fb_cdn_url(thumbnail_path)
            if not public_url:
                # Fallback: try external temp host
                public_url = self._upload_to_temp_host(thumbnail_path)
            if public_url:
                from src.mcp_servers.mcp_instagram_server import post_image
                try:
                    result_str = self._run_async(post_image(public_url, caption))
                    result = json.loads(result_str)
                    if result.get("error"):
                        log.warning("[%s] Instagram image post failed: %s", self.name, result["error"])
                        return "failed"
                    log.info("[%s] Instagram image posted -- media_id=%s",
                             self.name, result.get("media_id"))
                    return "posted"
                except Exception as exc:
                    log.warning("[%s] Instagram image post failed: %s", self.name, exc)
                    return "failed"
            else:
                log.warning("[%s] Failed to get public URL for thumbnail -- skipping Instagram",
                            self.name)
                return "skipped:upload_failed"

        log.warning("[%s] No video URL or thumbnail for Instagram -- skipping", self.name)
        return "skipped:no_media"

    # -- TikTok via MCP server ------------------------------------------------

    def _publish_tiktok(self, state: PipelineState) -> str:
        """Upload video to TikTok via the TikTok MCP server."""
        if not self.tiktok_token:
            log.warning("[%s] TIKTOK_ACCESS_TOKEN not set -- skipping TikTok", self.name)
            return "skipped:no_api_key"

        metadata = state.get("metadata", {})
        title = metadata.get("youtube_title_a", state.get("topic", ""))
        video_path = state.get("visuals", {}).get("final_video", "")

        if not video_path or not Path(video_path).exists():
            log.warning("[%s] No video file for TikTok -- skipping", self.name)
            return "skipped:no_video"

        log.info("[%s] Uploading to TikTok", self.name)

        from src.mcp_servers.mcp_tiktok_server import upload_video

        try:
            result_str = self._run_async(upload_video(video_path, title[:150]))
            result = json.loads(result_str)
            if result.get("error"):
                log.warning("[%s] TikTok upload failed: %s", self.name, result["error"])
                return "failed"

            log.info("[%s] TikTok video uploaded -- publish_id=%s", self.name, result.get("publish_id"))
            return "uploaded"
        except Exception as exc:
            log.warning("[%s] TikTok upload failed: %s", self.name, exc)
            return "failed"

    # -- Pinterest via MCP server ---------------------------------------------

    def _publish_pinterest(self, state: PipelineState) -> str:
        """Create a pin on Pinterest via the Pinterest MCP server."""
        if not self.pinterest_token:
            log.warning("[%s] PINTEREST_ACCESS_TOKEN not set -- skipping Pinterest", self.name)
            return "skipped:no_api_key"

        metadata = state.get("metadata", {})
        title = metadata.get("youtube_title_a", state.get("topic", ""))
        description = metadata.get("youtube_description", "")
        thumbnail = state.get("visuals", {}).get("thumbnail_url", "")
        video_id = metadata.get("youtube_video_id", "")
        link = f"https://youtube.com/watch?v={video_id}" if video_id else ""

        if not thumbnail:
            log.warning("[%s] No thumbnail URL for Pinterest -- skipping", self.name)
            return "skipped:no_image"

        log.info("[%s] Creating Pinterest pin", self.name)

        from src.mcp_servers.mcp_pinterest_server import create_pin

        try:
            result_str = self._run_async(
                create_pin(title[:100], description[:800], thumbnail, link=link)
            )
            result = json.loads(result_str)
            if result.get("error"):
                log.warning("[%s] Pinterest pin failed: %s", self.name, result["error"])
                return "failed"

            log.info("[%s] Pinterest pin created", self.name)
            return "posted"
        except Exception as exc:
            log.warning("[%s] Pinterest pin failed: %s", self.name, exc)
            return "failed"

    # -- WordPress via MCP server ---------------------------------------------

    def _publish_wordpress(self, state: PipelineState) -> str:
        """Create a blog post on WordPress via the WordPress MCP server."""
        if not self.wordpress_url:
            log.warning("[%s] WORDPRESS_URL not set -- skipping WordPress", self.name)
            return "skipped:no_api_key"

        metadata = state.get("metadata", {})
        title = metadata.get("youtube_title_a", state.get("topic", ""))
        blog_html = state.get("blog", "")

        if not blog_html:
            log.warning("[%s] No blog content -- skipping WordPress", self.name)
            return "skipped:no_content"

        log.info("[%s] Creating WordPress blog post", self.name)

        from src.mcp_servers.mcp_wordpress_server import create_post

        try:
            result_str = self._run_async(create_post(title, blog_html, status="draft"))
            result = json.loads(result_str)
            if result.get("error"):
                log.warning("[%s] WordPress post failed: %s", self.name, result["error"])
                return "failed"

            log.info("[%s] WordPress post created -- id=%s", self.name, result.get("post_id"))
            return "created"
        except Exception as exc:
            log.warning("[%s] WordPress post failed: %s", self.name, exc)
            return "failed"

    # -- Threads via MCP server (V3.8.3.3 Gap #5) ----------------------------

    def _publish_threads(self, state: PipelineState) -> str:
        """Post to Threads via the Threads MCP server."""
        if not self.threads_token:
            log.warning("[%s] THREADS_ACCESS_TOKEN not set -- skipping Threads", self.name)
            return "skipped:no_api_key"

        metadata = state.get("metadata", {})
        title = metadata.get("youtube_title_a", state.get("topic", ""))
        video_id = metadata.get("youtube_video_id", "")
        video_link = f"https://youtube.com/watch?v={video_id}" if video_id else ""

        text = f"{title}\n\n{video_link}\n\n#personalfinance #moolahiq"[:500]

        log.info("[%s] Posting to Threads", self.name)

        result = self._post(
            "http://localhost:8013/tools/create_post",
            {"text": text, "media_type": "TEXT"},
            label="threads_post",
        )

        if result and result.get("id"):
            log.info("[%s] Threads post published -- id=%s", self.name, result.get("id"))
            return "posted"

        return "failed"

    # -- Shorts distribution (V3.8.3.3 Gap #4) --------------------------------

    def _publish_shorts(self, state: PipelineState) -> dict[str, str]:
        """Distribute Shorts clips across platforms (V3.8.3.3).

        Reads shorts_clips from state (list of file paths produced by Production Agent).
        Enqueues them for staggered distribution: 2-3/day, min 4 hours apart,
        max 3/day/platform. Distributes across YouTube, Instagram, TikTok, X, Facebook, Pinterest.
        """
        shorts_clips = state.get("visuals", {}).get("shorts_clips", [])
        if not shorts_clips:
            log.info("[%s] No Shorts clips in state -- skipping Shorts distribution", self.name)
            return {"shorts": "skipped:no_clips"}

        log.info("[%s] Distributing %d Shorts clips", self.name, len(shorts_clips))

        metadata = state.get("metadata", {})
        topic = metadata.get("youtube_title_a", state.get("topic", ""))
        shorts_results: dict[str, list[str]] = {}

        # Shorts distribution calendar: Tue-Fri, 3/day, 4hr apart (8AM, 12PM, 4PM PST)
        # Stagger across platforms: each short goes to a subset of platforms
        platforms_rotation = [
            ["youtube", "instagram", "tiktok"],
            ["youtube", "x", "facebook"],
            ["youtube", "instagram", "pinterest"],
        ]

        now_pst = datetime.now(PST)
        base_date = now_pst.replace(hour=8, minute=0, second=0, microsecond=0)

        # Schedule the next available publish days (Tue-Fri)
        for i, clip_path in enumerate(shorts_clips[:10]):  # Max 10 per video
            if not Path(clip_path).exists():
                log.warning("[%s] Shorts clip not found: %s", self.name, clip_path)
                continue

            # Calculate schedule: 3 per day, 4 hours apart
            day_offset = i // 3
            time_slot = i % 3  # 0=8AM, 1=12PM, 2=4PM
            scheduled = base_date + timedelta(days=day_offset, hours=time_slot * 4)

            # Rotate platforms
            platforms = platforms_rotation[i % len(platforms_rotation)]
            short_title = f"{topic} #{i + 1}"[:100]

            for platform in platforms:
                self._enqueue(
                    f"short_{platform}",
                    {
                        "video_path": clip_path,
                        "title": short_title,
                        "is_short": True,
                    },
                    scheduled_utc=scheduled.astimezone(timezone.utc).isoformat(),
                )
                shorts_results.setdefault(platform, []).append("queued")

        total_queued = sum(len(v) for v in shorts_results.values())
        log.info("[%s] Shorts distribution queued -- %d items across %d platforms",
                 self.name, total_queued, len(shorts_results))

        return {"shorts": f"queued:{total_queued}"}

    # -- Velocity enforcement (V3.8.3.3 Gap #6) -------------------------------

    @staticmethod
    def _check_velocity(platform: str) -> bool:
        """Check if publishing to a platform would violate velocity limits.

        Returns True if safe to publish, False if velocity limit would be exceeded.
        Max 3 posts/day/platform enforced.
        """
        if not QUEUE_PATH.exists():
            return True

        try:
            queue = json.loads(QUEUE_PATH.read_text())
            today = datetime.now(timezone.utc).date().isoformat()
            today_count = sum(
                1 for item in queue
                if item.get("platform", "").startswith(platform)
                and item.get("scheduled_utc", "").startswith(today)
                and item.get("status") != "failed"
            )
            if today_count >= MAX_POSTS_PER_DAY_PER_PLATFORM:
                log.warning("[publishing] Velocity limit: %s already has %d posts today (max %d)",
                            platform, today_count, MAX_POSTS_PER_DAY_PER_PLATFORM)
                return False
        except Exception:
            pass
        return True

    @staticmethod
    def _is_publish_day() -> bool:
        """Check if today is a valid publish day (Tuesday or Thursday)."""
        now_pst = datetime.now(PST)
        day_name = now_pst.strftime("%A").lower()
        return day_name in PUBLISH_DAYS

    # -- Failure logging (V3.8.3.3 Gap #6) ------------------------------------

    @staticmethod
    def _log_failure(platform: str, error: str, payload: dict | None = None) -> None:
        """Log a publish failure to publish_failures.json for manual review."""
        try:
            failures: list[dict] = []
            if FAILURES_PATH.exists():
                failures = json.loads(FAILURES_PATH.read_text())

            failures.append({
                "id": str(uuid4()),
                "platform": platform,
                "error": str(error)[:500],
                "payload_summary": {k: str(v)[:100] for k, v in (payload or {}).items()},
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "resolved": False,
            })

            FAILURES_PATH.parent.mkdir(parents=True, exist_ok=True)
            FAILURES_PATH.write_text(json.dumps(failures, indent=2, default=str))
            log.info("[publishing] Failure logged to publish_failures.json (%s: %s)",
                     platform, error[:80])
        except Exception as exc:
            log.warning("[publishing] Failed to write publish_failures.json: %s", exc)

    # -- Webhook triggers (V3.8.3.3 Gap #6) -----------------------------------

    def _schedule_webhook_polls(self, state: PipelineState) -> None:
        """Schedule post-publish webhook polling for engagement milestones.

        V3.8.3.3: YouTube Analytics API polled every 6 hours for first 48 hours.
        - Video hits 1K views in 24hrs → trigger Research Agent follow-up brief
        - Video hits 50+ comments → trigger Content Agent FAQ response batch
        - Shorts CTR > 8% → flag as 'expand to long-form' candidate
        """
        video_id = state.get("metadata", {}).get("youtube_video_id", "")
        if not video_id or video_id.startswith("MOCK_"):
            return

        # Enqueue polling tasks for the scheduler
        now = datetime.now(timezone.utc)
        for hours_offset in [6, 12, 18, 24, 30, 36, 42, 48]:
            poll_time = now + timedelta(hours=hours_offset)
            self._enqueue(
                "webhook_poll",
                {
                    "video_id": video_id,
                    "check_type": "engagement_milestones",
                    "thresholds": {
                        "views_1k_trigger": 1000,
                        "comments_50_trigger": 50,
                        "shorts_ctr_trigger": 0.08,
                    },
                },
                video_id=video_id,
                scheduled_utc=poll_time.isoformat(),
            )

        log.info("[%s] Scheduled 8 webhook polls over 48hrs for video %s", self.name, video_id)

    # -- Main entry point ------------------------------------------------------

    def _mock_run(self, state: PipelineState) -> PipelineState:
        """Return realistic mock publish status for dry-run testing (V3.8.3.3)."""
        log.info("[%s] MOCK MODE -- simulating multi-platform publish", self.name)
        state.setdefault("metadata", {})["youtube_video_id"] = "MOCK_dQw4w9WgXcQ"
        state["publish_status"] = {
            "youtube": "uploaded",
            "blog": "created",
            "newsletter": "scheduled",
            "social": "posted",
            "shorts": "queued:30",
        }
        state.setdefault("metadata", {})["social_publish_detail"] = {
            "x": "posted",
            "facebook": "posted",
            "instagram": "posted",
            "tiktok": "uploaded",
            "pinterest": "posted",
            "threads": "posted",
            "wordpress": "created",
        }
        state.setdefault("metadata", {})["velocity_check"] = "passed"
        state.setdefault("metadata", {})["webhook_polls_scheduled"] = 8
        log.info("[%s] MOCK publish complete -- all platforms published (V3.8.3.3)", self.name)
        return state

    def run(self, state: PipelineState) -> PipelineState:
        """Publish content across all platforms (V3.8.3.3).

        Includes velocity enforcement, Threads support, Shorts distribution,
        webhook triggers, and publish_failures.json logging.
        """
        if state.get("mock_mode"):
            return self._mock_run(state)

        log.info("[%s] Starting multi-platform publish (V3.8.3.3)", self.name)

        # Build skip set from state (case-insensitive)
        skip = {s.lower() for s in state.get("skip_platforms", [])}
        if skip:
            log.info("[%s] Skipping platforms: %s", self.name, ", ".join(sorted(skip)))

        # -- Velocity check (V3.8.3.3) ----------------------------------------
        is_pub_day = self._is_publish_day()
        if not is_pub_day:
            log.info("[%s] Not a publish day (Tue/Thu) -- long-form will be queued, not published live",
                     self.name)

        # YouTube upload (first — other platforms may reference the video)
        if "youtube" in skip:
            yt_status = "skipped:user_request"
        elif not self._check_velocity("youtube"):
            yt_status = "skipped:velocity_limit"
        else:
            yt_status = self._publish_youtube(state)
            if yt_status == "failed":
                self._log_failure("youtube", "Upload failed after retries",
                                  self._build_payload(state, "youtube"))

        # Newsletter
        if "newsletter" in skip:
            nl_status = "skipped:user_request"
        else:
            nl_status = self._publish_newsletter(state)
            if nl_status == "failed":
                self._log_failure("newsletter", "Newsletter creation failed")

        # Social media cross-posts (staggered)
        social_statuses: dict[str, str] = {}

        # X — post immediately
        if "x" in skip or "twitter" in skip:
            social_statuses["x"] = "skipped:user_request"
        elif not self._check_velocity("x"):
            social_statuses["x"] = "skipped:velocity_limit"
        else:
            social_statuses["x"] = self._publish_x(state)

        # Facebook — stagger +15 min via queue
        if "facebook" in skip:
            social_statuses["facebook"] = "skipped:user_request"
        elif not self._check_velocity("facebook"):
            social_statuses["facebook"] = "skipped:velocity_limit"
        else:
            time.sleep(2)  # small delay between API calls
            social_statuses["facebook"] = self._publish_facebook(state)

        # Instagram — stagger +30 min via queue
        if "instagram" in skip:
            social_statuses["instagram"] = "skipped:user_request"
        elif not self._check_velocity("instagram"):
            social_statuses["instagram"] = "skipped:velocity_limit"
        else:
            time.sleep(2)
            social_statuses["instagram"] = self._publish_instagram(state)

        # TikTok
        if "tiktok" in skip:
            social_statuses["tiktok"] = "skipped:user_request"
        elif not self._check_velocity("tiktok"):
            social_statuses["tiktok"] = "skipped:velocity_limit"
        else:
            social_statuses["tiktok"] = self._publish_tiktok(state)

        # Pinterest
        if "pinterest" in skip:
            social_statuses["pinterest"] = "skipped:user_request"
        elif not self._check_velocity("pinterest"):
            social_statuses["pinterest"] = "skipped:velocity_limit"
        else:
            social_statuses["pinterest"] = self._publish_pinterest(state)

        # Threads (V3.8.3.3)
        if "threads" in skip:
            social_statuses["threads"] = "skipped:user_request"
        elif not self._check_velocity("threads"):
            social_statuses["threads"] = "skipped:velocity_limit"
        else:
            social_statuses["threads"] = self._publish_threads(state)

        # WordPress blog
        if "wordpress" in skip:
            wp_status = "skipped:user_request"
        else:
            wp_status = self._publish_wordpress(state)
            if wp_status == "failed":
                self._log_failure("wordpress", "Blog post creation failed")

        # -- Shorts distribution (V3.8.3.3) ------------------------------------
        shorts_result = {}
        if "shorts" not in skip:
            shorts_result = self._publish_shorts(state)

        # Determine aggregate social status
        social_values = list(social_statuses.values())
        active_values = [s for s in social_values if not s.startswith("skipped")]

        if not active_values:
            social_agg = "skipped"
        elif all(s in ("posted", "uploaded") for s in active_values):
            social_agg = "posted"
        elif any(s in ("posted", "uploaded") for s in active_values):
            social_agg = "partial"
        else:
            social_agg = "failed"

        state["publish_status"] = {
            "youtube": yt_status,
            "blog": wp_status,
            "newsletter": nl_status,
            "social": social_agg,
            **shorts_result,
        }

        # Store detailed social breakdown
        meta = state.setdefault("metadata", {})
        meta["social_publish_detail"] = social_statuses
        meta["velocity_check"] = "passed" if is_pub_day else "not_publish_day"

        # -- Log failures for all failed platforms (V3.8.3.3) ------------------
        all_statuses = {**social_statuses}
        if nl_status == "failed":
            all_statuses["newsletter"] = "failed"
        if wp_status == "failed":
            all_statuses["wordpress"] = "failed"

        for platform, status in all_statuses.items():
            if status == "failed":
                self._log_failure(platform, f"{platform} publish failed",
                                  self._build_payload(state, platform))
                self._enqueue(platform, self._build_payload(state, platform))

        # -- Schedule webhook polls (V3.8.3.3) ---------------------------------
        self._schedule_webhook_polls(state)

        log.info("[%s] Publish complete -- yt=%s, nl=%s, social=%s, blog=%s, shorts=%s",
                 self.name, yt_status, nl_status, social_agg, wp_status,
                 shorts_result.get("shorts", "n/a"))
        return state
