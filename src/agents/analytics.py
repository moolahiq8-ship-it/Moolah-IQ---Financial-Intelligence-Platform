"""Analytics Agent — Direct platform API metrics collection.

Pulls post-publish performance data from YouTube (Data API + Analytics API),
newsletter (Beehiiv), and social platforms (X, Facebook, Instagram, Pinterest)
via their respective MCP servers. Feeds the optimization loop.
"""

from __future__ import annotations

import asyncio
import json
import logging
import os
import time
from typing import Any

import httpx
from dotenv import load_dotenv

from src.state import PipelineState

load_dotenv()
log = logging.getLogger(__name__)

MAX_RETRIES = 3
REQUEST_TIMEOUT = 30


class AnalyticsAgent:
    """Collects post-publish performance data across platforms."""

    def __init__(self) -> None:
        self.name = "analytics"
        self.youtube_api_key = os.getenv("YOUTUBE_API_KEY", "")
        self.newsletter_api_key = os.getenv("NEWSLETTER_API_KEY", "")
        self.beehiiv_pub_id = os.getenv("BEEHIIV_PUBLICATION_ID", "")
        self.x_api_key = os.getenv("X_API_KEY", "")
        self.fb_token = (
            os.getenv("FACEBOOK_SYSTEM_USER_TOKEN", "")
            or os.getenv("FACEBOOK_PAGE_ACCESS_TOKEN", "")
        )
        self.ig_token = (
            os.getenv("FACEBOOK_SYSTEM_USER_TOKEN", "")
            or os.getenv("INSTAGRAM_ACCESS_TOKEN", "")
        )
        self.pinterest_token = os.getenv("PINTEREST_ACCESS_TOKEN", "")
        log.info("[%s] Initialized (youtube_key=%s, x=%s, fb=%s, ig=%s, pinterest=%s)",
                 self.name,
                 "set" if self.youtube_api_key else "NOT SET",
                 bool(self.x_api_key),
                 bool(self.fb_token),
                 bool(self.ig_token),
                 bool(self.pinterest_token))

    # -- Async bridge ----------------------------------------------------------

    @staticmethod
    def _run_async(coro):
        """Run an async coroutine from sync context."""
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                import concurrent.futures
                with concurrent.futures.ThreadPoolExecutor() as pool:
                    return pool.submit(asyncio.run, coro).result()
            return loop.run_until_complete(coro)
        except RuntimeError:
            return asyncio.run(coro)

    # -- HTTP helper -----------------------------------------------------------

    def _get(self, url: str, params: dict | None = None,
             headers: dict | None = None, label: str = "request") -> dict[str, Any]:
        """GET with retry and graceful degradation."""
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                resp = httpx.get(
                    url, params=params, headers=headers or {},
                    timeout=REQUEST_TIMEOUT,
                )
                resp.raise_for_status()
                return resp.json()
            except httpx.ConnectError:
                log.warning("[%s] %s: connection refused (attempt %d/%d)",
                            self.name, label, attempt, MAX_RETRIES)
            except httpx.HTTPStatusError as exc:
                log.warning("[%s] %s: HTTP %d (attempt %d/%d)",
                            self.name, label, exc.response.status_code,
                            attempt, MAX_RETRIES)
            except Exception as exc:
                log.warning("[%s] %s failed (attempt %d/%d): %s",
                            self.name, label, attempt, MAX_RETRIES, exc)
            if attempt < MAX_RETRIES:
                time.sleep(2 ** attempt)

        log.error("[%s] %s: all %d attempts failed", self.name, label, MAX_RETRIES)
        return {}

    # -- Platform data fetchers ------------------------------------------------

    def _fetch_youtube_analytics(self, video_id: str) -> dict[str, Any]:
        """Pull YouTube video statistics via Data API v3."""
        if not self.youtube_api_key:
            log.warning("[%s] YOUTUBE_API_KEY not set -- returning empty analytics", self.name)
            return self._empty_youtube()

        if not video_id:
            log.warning("[%s] No video_id available -- returning empty analytics", self.name)
            return self._empty_youtube()

        log.info("[%s] Fetching YouTube analytics for video_id=%s", self.name, video_id)

        # YouTube Data API v3: basic stats
        data = self._get(
            "https://www.googleapis.com/youtube/v3/videos",
            params={
                "part": "statistics,contentDetails",
                "id": video_id,
                "key": self.youtube_api_key,
            },
            label="youtube_stats",
        )

        if not data or not data.get("items"):
            log.warning("[%s] No YouTube data returned for %s", self.name, video_id)
            return self._empty_youtube()

        item = data["items"][0]
        stats = item.get("statistics", {})
        result = {
            "video_id": video_id,
            "views_48h": int(stats.get("viewCount", 0)),
            "likes": int(stats.get("likeCount", 0)),
            "comments": int(stats.get("commentCount", 0)),
            "ctr": 0.0,
            "avg_watch_time_seconds": 0,
            "subscriber_delta": 0,
            "data_source": "youtube_data_api_v3",
        }

        # Try enriching with YouTube Analytics API v2 via MCP server
        perf_data = self._get(
            "http://localhost:8001/tools/poll_video_performance",
            params=None,
            headers={"Content-Type": "application/json"},
            label="youtube_analytics",
        )
        # Use POST for the FastAPI endpoint
        try:
            perf_resp = httpx.post(
                "http://localhost:8001/tools/poll_video_performance",
                json={"video_id": video_id, "days": 7},
                timeout=15,
            )
            if perf_resp.status_code == 200:
                perf = perf_resp.json()
                if perf.get("data_source") == "youtube_analytics_api_v2":
                    result["avg_watch_time_seconds"] = perf.get("avg_view_duration_seconds", 0)
                    result["subscriber_delta"] = (
                        perf.get("subscribers_gained", 0) - perf.get("subscribers_lost", 0)
                    )
                    result["data_source"] = "youtube_data_api_v3+analytics_v2"
        except Exception:
            pass  # graceful fallback to Data API only

        return result

    @staticmethod
    def _empty_youtube() -> dict[str, Any]:
        return {
            "video_id": "",
            "views_48h": 0,
            "likes": 0,
            "comments": 0,
            "ctr": 0.0,
            "avg_watch_time_seconds": 0,
            "subscriber_delta": 0,
            "data_source": "unavailable",
        }

    def _fetch_newsletter_analytics(self, state: PipelineState) -> dict[str, Any]:
        """Pull newsletter edition stats directly from Beehiiv API."""
        if not self.newsletter_api_key:
            log.warning("[%s] NEWSLETTER_API_KEY not set -- returning empty", self.name)
            return {"open_rate": 0.0, "click_rate": 0.0, "unsubscribe_rate": 0.0,
                    "reply_count": 0, "data_source": "unavailable"}

        log.info("[%s] Fetching newsletter analytics from Beehiiv", self.name)

        pub_id = self.beehiiv_pub_id
        if not pub_id:
            return {"open_rate": 0.0, "click_rate": 0.0, "unsubscribe_rate": 0.0,
                    "reply_count": 0, "data_source": "unavailable"}

        data = self._get(
            f"https://api.beehiiv.com/v2/publications/{pub_id}/posts",
            params={"limit": "1", "status": "confirmed"},
            headers={"Authorization": f"Bearer {self.newsletter_api_key}"},
            label="beehiiv_stats",
        )

        if not data or not data.get("data"):
            return {"open_rate": 0.0, "click_rate": 0.0, "unsubscribe_rate": 0.0,
                    "reply_count": 0, "data_source": "unavailable"}

        post = data["data"][0] if data["data"] else {}
        stats = post.get("stats", {})

        return {
            "open_rate": stats.get("open_rate", 0.0),
            "click_rate": stats.get("click_rate", 0.0),
            "unsubscribe_rate": stats.get("unsubscribe_rate", 0.0),
            "reply_count": stats.get("reply_count", 0),
            "data_source": "beehiiv_api",
        }

    def _fetch_social_analytics(self, state: PipelineState) -> dict[str, Any]:
        """Pull social media metrics from each platform's MCP server directly."""
        log.info("[%s] Fetching social analytics from platform APIs", self.name)

        platforms: dict[str, dict] = {}
        total_impressions = 0
        total_engagement = 0
        total_clicks = 0

        # X (Twitter) metrics
        social_detail = state.get("metadata", {}).get("social_publish_detail", {})

        if self.x_api_key:
            x_tweet_id = social_detail.get("x_tweet_id", "")
            if x_tweet_id:
                try:
                    from src.mcp_servers.mcp_x_server import get_tweet_metrics
                    result_str = self._run_async(get_tweet_metrics(x_tweet_id))
                    result = json.loads(result_str)
                    if not result.get("error"):
                        impressions = result.get("impression_count", 0)
                        engagement = (
                            result.get("like_count", 0) +
                            result.get("retweet_count", 0) +
                            result.get("reply_count", 0)
                        )
                        platforms["x"] = {
                            "impressions": impressions,
                            "engagement": engagement,
                            "likes": result.get("like_count", 0),
                            "retweets": result.get("retweet_count", 0),
                        }
                        total_impressions += impressions
                        total_engagement += engagement
                except Exception as exc:
                    log.warning("[%s] X analytics failed: %s", self.name, exc)

        # Facebook insights
        if self.fb_token:
            fb_post_id = social_detail.get("facebook_post_id", "")
            if fb_post_id:
                try:
                    from src.mcp_servers.mcp_facebook_server import get_post_insights
                    result_str = self._run_async(get_post_insights(fb_post_id))
                    result = json.loads(result_str)
                    if not result.get("error"):
                        fb_data = result.get("data", [])
                        fb_metrics = {}
                        for metric in fb_data:
                            fb_metrics[metric.get("name", "")] = (
                                metric.get("values", [{}])[0].get("value", 0)
                            )
                        impressions = fb_metrics.get("post_impressions", 0)
                        engagement = fb_metrics.get("post_engagements", 0)
                        platforms["facebook"] = {
                            "impressions": impressions,
                            "engagement": engagement,
                            "clicks": fb_metrics.get("post_clicks", 0),
                        }
                        total_impressions += impressions
                        total_engagement += engagement
                        total_clicks += fb_metrics.get("post_clicks", 0)
                except Exception as exc:
                    log.warning("[%s] Facebook analytics failed: %s", self.name, exc)

        # Instagram insights
        if self.ig_token:
            ig_media_id = social_detail.get("instagram_media_id", "")
            if ig_media_id:
                try:
                    from src.mcp_servers.mcp_instagram_server import get_media_insights
                    result_str = self._run_async(get_media_insights(ig_media_id))
                    result = json.loads(result_str)
                    if not result.get("error"):
                        ig_data = result.get("data", [])
                        ig_metrics = {}
                        for metric in ig_data:
                            ig_metrics[metric.get("name", "")] = (
                                metric.get("values", [{}])[0].get("value", 0)
                            )
                        impressions = ig_metrics.get("impressions", 0)
                        engagement = (
                            ig_metrics.get("likes", 0) +
                            ig_metrics.get("comments", 0) +
                            ig_metrics.get("shares", 0)
                        )
                        platforms["instagram"] = {
                            "impressions": impressions,
                            "engagement": engagement,
                            "reach": ig_metrics.get("reach", 0),
                            "plays": ig_metrics.get("plays", 0),
                        }
                        total_impressions += impressions
                        total_engagement += engagement
                except Exception as exc:
                    log.warning("[%s] Instagram analytics failed: %s", self.name, exc)

        # Pinterest analytics
        if self.pinterest_token:
            try:
                from datetime import datetime, timedelta
                from src.mcp_servers.mcp_pinterest_server import get_analytics

                end_date = datetime.now().strftime("%Y-%m-%d")
                start_date = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
                result_str = self._run_async(
                    get_analytics(start_date=start_date, end_date=end_date)
                )
                result = json.loads(result_str)
                if not result.get("error"):
                    platforms["pinterest"] = {
                        "impressions": result.get("IMPRESSION", 0),
                        "saves": result.get("SAVE", 0),
                        "clicks": result.get("PIN_CLICK", 0),
                    }
                    total_impressions += result.get("IMPRESSION", 0)
                    total_clicks += result.get("PIN_CLICK", 0)
            except Exception as exc:
                log.warning("[%s] Pinterest analytics failed: %s", self.name, exc)

        engagement_rate = (
            total_engagement / total_impressions if total_impressions > 0 else 0.0
        )

        return {
            "total_impressions": total_impressions,
            "engagement_rate": round(engagement_rate, 4),
            "click_throughs": total_clicks,
            "platforms": platforms,
            "data_source": "direct_api" if platforms else "unavailable",
        }

    def _fetch_blog_analytics(self, state: PipelineState) -> dict[str, Any]:
        """Pull blog post analytics (placeholder for GA4 integration)."""
        log.info("[%s] Blog analytics: placeholder (GA4 integration pending)", self.name)
        return {
            "page_views": 0,
            "avg_time_on_page_seconds": 0,
            "bounce_rate": 0.0,
            "scroll_depth_pct": 0.0,
            "internal_link_clicks": 0,
            "data_source": "unavailable",
        }

    # -- Main entry point ------------------------------------------------------

    def _mock_run(self, state: PipelineState) -> PipelineState:
        """Return realistic mock analytics data for dry-run testing."""
        log.info("[%s] MOCK MODE -- returning simulated analytics", self.name)
        state.setdefault("metadata", {})["analytics"] = {
            "youtube": {
                "video_id": state.get("metadata", {}).get("youtube_video_id", "MOCK_ID"),
                "views_48h": 2_847,
                "likes": 312,
                "comments": 47,
                "ctr": 0.068,
                "avg_watch_time_seconds": 385,
                "subscriber_delta": 23,
                "data_source": "mock",
            },
            "newsletter": {
                "open_rate": 0.42,
                "click_rate": 0.08,
                "unsubscribe_rate": 0.002,
                "reply_count": 14,
                "data_source": "mock",
            },
            "social": {
                "total_impressions": 8_420,
                "engagement_rate": 0.045,
                "click_throughs": 156,
                "platforms": {
                    "x": {"impressions": 2_800, "engagement": 106},
                    "facebook": {"impressions": 2_200, "engagement": 88, "clicks": 42},
                    "instagram": {"impressions": 1_800, "engagement": 72, "reach": 1_500, "plays": 900},
                    "pinterest": {"impressions": 1_620, "saves": 45, "clicks": 38},
                },
                "data_source": "mock",
            },
            "blog": {
                "page_views": 1_205,
                "avg_time_on_page_seconds": 194,
                "bounce_rate": 0.38,
                "scroll_depth_pct": 0.72,
                "internal_link_clicks": 89,
                "data_source": "mock",
            },
        }
        log.info("[%s] MOCK analytics complete -- YT views=2847, NL open=42%%", self.name)
        return state

    def run(self, state: PipelineState) -> PipelineState:
        """Pull analytics from all platforms and attach to state."""
        if state.get("mock_mode"):
            return self._mock_run(state)

        log.info("[%s] Collecting post-publish analytics", self.name)

        video_id = state.get("metadata", {}).get("youtube_video_id", "")

        youtube = self._fetch_youtube_analytics(video_id)
        newsletter = self._fetch_newsletter_analytics(state)
        social = self._fetch_social_analytics(state)
        blog = self._fetch_blog_analytics(state)

        analytics_report = {
            "youtube": youtube,
            "newsletter": newsletter,
            "social": social,
            "blog": blog,
        }

        state.setdefault("metadata", {})["analytics"] = analytics_report

        log.info(
            "[%s] Analytics collected -- YT views=%d, NL open=%.1f%%, "
            "Social impressions=%d, Blog views=%d",
            self.name,
            youtube.get("views_48h", 0),
            newsletter.get("open_rate", 0) * 100,
            social.get("total_impressions", 0),
            blog.get("page_views", 0),
        )
        return state
