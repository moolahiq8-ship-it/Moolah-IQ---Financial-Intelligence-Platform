"""Insight Synthesizer Agent — Pattern analysis across rolling 10-video window.

Analyzes performance data to extract actionable patterns: hook effectiveness,
credential resonance, pillar CPM trends, thumbnail DNA, title formulas,
optimal video length. Outputs insight_report.json.

V3.8.3.3 — Self-Improvement Layer Stage 2.
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
INSIGHT_REPORT_PATH = DATA_DIR / "insight_report.json"
ROLLING_WINDOW = 10


class InsightSynthesizerAgent:
    """Analyzes rolling performance data to extract actionable patterns."""

    def __init__(self) -> None:
        self.name = "insight_synthesizer"
        log.info("[%s] Initialized", self.name)

    def _load_performance_data(self) -> list[dict[str, Any]]:
        """Load performance data from harvester output."""
        if PERFORMANCE_DATA_PATH.exists():
            try:
                data = json.loads(PERFORMANCE_DATA_PATH.read_text())
                return data[-ROLLING_WINDOW:]  # rolling window
            except Exception:
                return []
        return []

    def _synthesize(self, data: list[dict[str, Any]]) -> dict[str, Any]:
        """Analyze patterns across the rolling video window.

        TODO: Implement Ollama llama4:16x17b LLM analysis for deep pattern detection.
        For now returns structural skeleton matching directive Section 2.3.
        """
        return {
            "window_size": len(data),
            "top_performers": [],      # Top 3 videos with Performance DNA
            "underperformers": [],     # Bottom 3 with Failure Autopsy
            "emerging_patterns": [],   # New patterns not seen in prior window
            "deprecate": [],           # Patterns that consistently underperform
            "weight_updates": {},      # Recommended Decision Agent weight changes
            "hook_analysis": {},       # Hook type -> avg 30s retention
            "credential_resonance": {},  # Credential -> engagement score
            "pillar_cpm_trends": {},   # Pillar -> CPM trend
            "tension_loop_effectiveness": {},
            "pattern_interrupt_timing": {},
            "thumbnail_dna": {},       # Winning visual formulas
            "title_formula_ctr": {},   # Title structure -> CTR
            "optimal_video_length": None,
        }

    def _mock_run(self, state: PipelineState) -> PipelineState:
        """Return mock synthesis for dry-run testing."""
        log.info("[%s] MOCK MODE -- generating sample insight report", self.name)
        state.setdefault("improvement_cycle_status", {})["synthesize"] = "complete"
        return state

    def run(self, state: PipelineState) -> PipelineState:
        """Synthesize patterns from performance data."""
        if state.get("mock_mode"):
            return self._mock_run(state)

        log.info("[%s] Starting pattern synthesis", self.name)

        data = self._load_performance_data()
        if len(data) < 3:
            log.info("[%s] Insufficient data (%d videos, need 3+) -- skipping synthesis",
                     self.name, len(data))
            state.setdefault("improvement_cycle_status", {})["synthesize"] = "skipped:insufficient_data"
            return state

        report = self._synthesize(data)
        INSIGHT_REPORT_PATH.parent.mkdir(parents=True, exist_ok=True)
        INSIGHT_REPORT_PATH.write_text(json.dumps(report, indent=2, default=str))

        state.setdefault("improvement_cycle_status", {})["synthesize"] = "complete"
        log.info("[%s] Synthesis complete -- %d videos analyzed", self.name, len(data))
        return state
