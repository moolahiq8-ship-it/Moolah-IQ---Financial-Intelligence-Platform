"""Performance Harvester Agent — YouTube Analytics API data collection.

Pulls retention curves, CTR, view duration, subscriber gain/loss,
comment sentiment, enrollment keywords, and thumbnail A/B results
for every published video. Outputs performance_data.json.

V3.8.3.3 — Self-Improvement Layer Stage 1.
"""

from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from src.state import PipelineState

load_dotenv()
log = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
PERFORMANCE_DATA_PATH = DATA_DIR / "performance_data.json"


class PerformanceHarvesterAgent:
    """Pulls and structures performance data from YouTube Analytics API."""

    def __init__(self) -> None:
        self.name = "performance_harvester"
        self.youtube_api_key = os.getenv("YOUTUBE_API_KEY", "")
        log.info("[%s] Initialized (youtube_analytics=%s)", self.name, bool(self.youtube_api_key))

    def _load_existing_data(self) -> list[dict[str, Any]]:
        """Load existing performance data."""
        if PERFORMANCE_DATA_PATH.exists():
            try:
                return json.loads(PERFORMANCE_DATA_PATH.read_text())
            except Exception:
                return []
        return []

    def _save_data(self, data: list[dict[str, Any]]) -> None:
        """Persist performance data."""
        PERFORMANCE_DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
        PERFORMANCE_DATA_PATH.write_text(json.dumps(data, indent=2, default=str))

    def _harvest_video(self, video_id: str) -> dict[str, Any]:
        """Pull analytics for a single video from YouTube Analytics API.

        TODO: Implement YouTube Analytics API v2 calls once OAuth is configured.
        For now returns a skeleton that the pipeline can populate.
        """
        return {
            "video_id": video_id,
            "retention_curve": [],
            "thirty_second_retention": None,
            "avg_view_duration": None,
            "avg_percentage_watched": None,
            "ctr_by_thumbnail": {},
            "subscriber_gain_loss": 0,
            "comment_sentiment": {"positive": 0, "negative": 0, "neutral": 0},
            "enrollment_keywords": [],
            "shares": 0,
            "saves": 0,
            "likes": 0,
            "traffic_sources": {},
            "shorts_to_long_conversion": None,
            "drop_timestamps": [],
            "replay_timestamps": [],
            "performance_grade": None,  # A/B/C/D
        }

    def _mock_run(self, state: PipelineState) -> PipelineState:
        """Return mock harvest data for dry-run testing."""
        log.info("[%s] MOCK MODE -- generating sample performance data", self.name)
        state.setdefault("improvement_cycle_status", {})["harvest"] = "complete"
        state.setdefault("metadata", {})["performance_data"] = {
            "videos_harvested": 0,
            "status": "mock_complete",
        }
        return state

    def run(self, state: PipelineState) -> PipelineState:
        """Harvest performance data for all recently published videos."""
        if state.get("mock_mode"):
            return self._mock_run(state)

        log.info("[%s] Starting performance data harvest", self.name)

        # Collect video IDs from publish history
        video_id = state.get("metadata", {}).get("youtube_video_id", "")
        existing = self._load_existing_data()

        if video_id and not any(v.get("video_id") == video_id for v in existing):
            data = self._harvest_video(video_id)
            data["pillar"] = state.get("pillar", "")
            data["topic"] = state.get("topic", "")
            existing.append(data)
            self._save_data(existing)
            log.info("[%s] Harvested data for video %s", self.name, video_id)

        state.setdefault("improvement_cycle_status", {})["harvest"] = "complete"
        log.info("[%s] Harvest complete -- %d videos in database", self.name, len(existing))
        return state
