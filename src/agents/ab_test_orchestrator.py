"""A/B Test Orchestrator Agent — Validates prompt evolution via controlled experiments.

Designs and tracks controlled experiments: Video A (control prompts) vs
Video B (evolved prompts). Tracks which performs better before full deployment.
Requires 6-video minimum for Tier 1 (high-impact) changes, 4-video for Tier 2.

V3.8.3.3 — Self-Improvement Layer Stage 4.
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

from src.state import PipelineState

load_dotenv()
log = logging.getLogger(__name__)

DATA_DIR = Path(__file__).resolve().parents[2] / "data"
AB_TEST_CONFIG_PATH = DATA_DIR / "ab_test_config.json"
UPDATED_PROMPTS_PATH = DATA_DIR / "updated_prompts.json"

# Statistical significance requirements per tier
TIER1_MIN_VIDEOS = 6   # Hook structures, tension loops, credential injection
TIER1_CONSISTENCY = 4   # Must be consistent across 4 of 6 videos
TIER2_MIN_VIDEOS = 4   # SEO titles, metadata, tag strategies
TIER2_CONSISTENCY = 3   # Must be consistent across 3 of 4 videos
IMPROVEMENT_THRESHOLD = 0.05  # >5% improvement required


class ABTestOrchestratorAgent:
    """Designs and tracks A/B tests for prompt evolution validation."""

    def __init__(self) -> None:
        self.name = "ab_test_orchestrator"
        log.info("[%s] Initialized", self.name)

    def _load_config(self) -> dict[str, Any]:
        """Load current A/B test configuration."""
        if AB_TEST_CONFIG_PATH.exists():
            try:
                return json.loads(AB_TEST_CONFIG_PATH.read_text())
            except Exception:
                return {"active_tests": [], "completed_tests": []}
        return {"active_tests": [], "completed_tests": []}

    def _save_config(self, config: dict[str, Any]) -> None:
        """Persist A/B test configuration."""
        AB_TEST_CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
        AB_TEST_CONFIG_PATH.write_text(json.dumps(config, indent=2, default=str))

    def _load_evolutions(self) -> list[dict[str, Any]]:
        """Load evolved prompts awaiting A/B testing."""
        if UPDATED_PROMPTS_PATH.exists():
            try:
                return json.loads(UPDATED_PROMPTS_PATH.read_text())
            except Exception:
                return []
        return []

    def _create_test(self, evolution: dict[str, Any]) -> dict[str, Any]:
        """Create an A/B test configuration for an evolution."""
        change_type = evolution.get("change_type", "unknown")
        # Determine tier based on change type
        tier1_types = {"hook_structure", "tension_loop", "credential_injection",
                       "pattern_interrupt", "war_story_selection", "vis_scoring"}
        tier = 1 if change_type in tier1_types else 2

        return {
            "test_id": f"ab_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}",
            "agent": evolution.get("agent", ""),
            "change_type": change_type,
            "tier": tier,
            "min_videos": TIER1_MIN_VIDEOS if tier == 1 else TIER2_MIN_VIDEOS,
            "consistency_required": TIER1_CONSISTENCY if tier == 1 else TIER2_CONSISTENCY,
            "improvement_threshold": IMPROVEMENT_THRESHOLD,
            "primary_metric": "thirty_second_retention" if tier == 1 else "ctr",
            "control_results": [],
            "test_results": [],
            "status": "active",
            "created": datetime.now(timezone.utc).isoformat(),
            "rationale": evolution.get("rationale", ""),
        }

    def _evaluate_test(self, test: dict[str, Any]) -> str:
        """Evaluate whether an A/B test has enough data and a clear winner.

        Returns: 'insufficient_data', 'test_wins', 'control_wins', 'inconclusive'
        """
        control = test.get("control_results", [])
        test_results = test.get("test_results", [])
        min_videos = test.get("min_videos", TIER1_MIN_VIDEOS)

        if len(control) < min_videos or len(test_results) < min_videos:
            return "insufficient_data"

        # Compare primary metric averages
        control_avg = sum(r.get("value", 0) for r in control) / len(control)
        test_avg = sum(r.get("value", 0) for r in test_results) / len(test_results)

        if control_avg == 0:
            return "inconclusive"

        improvement = (test_avg - control_avg) / control_avg

        if improvement > IMPROVEMENT_THRESHOLD:
            # Check consistency
            consistency = test.get("consistency_required", TIER1_CONSISTENCY)
            wins = sum(1 for c, t in zip(control, test_results) if t.get("value", 0) > c.get("value", 0))
            if wins >= consistency:
                return "test_wins"
            return "inconclusive"

        if improvement < -IMPROVEMENT_THRESHOLD:
            return "control_wins"

        return "inconclusive"

    def _mock_run(self, state: PipelineState) -> PipelineState:
        """Return mock A/B test config for dry-run testing."""
        log.info("[%s] MOCK MODE -- no A/B tests initialized", self.name)
        state.setdefault("improvement_cycle_status", {})["ab_test"] = "complete"
        state["ab_test_config"] = {"active_tests": [], "completed_tests": []}
        return state

    def run(self, state: PipelineState) -> PipelineState:
        """Initialize or evaluate A/B tests for prompt evolutions."""
        if state.get("mock_mode"):
            return self._mock_run(state)

        log.info("[%s] Starting A/B test orchestration", self.name)

        config = self._load_config()
        evolutions = self._load_evolutions()

        # Create new tests for pending evolutions
        for evo in evolutions:
            if evo.get("requires_ab_test"):
                test = self._create_test(evo)
                config["active_tests"].append(test)
                log.info("[%s] Created A/B test %s for %s (%s)",
                         self.name, test["test_id"], evo.get("agent"), evo.get("change_type"))

        # Evaluate active tests
        for test in config.get("active_tests", []):
            result = self._evaluate_test(test)
            if result != "insufficient_data":
                test["status"] = result
                test["completed"] = datetime.now(timezone.utc).isoformat()
                config.setdefault("completed_tests", []).append(test)
                log.info("[%s] Test %s result: %s", self.name, test["test_id"], result)

        # Remove completed from active
        config["active_tests"] = [t for t in config.get("active_tests", []) if t.get("status") == "active"]

        self._save_config(config)
        state.setdefault("improvement_cycle_status", {})["ab_test"] = "complete"
        state["ab_test_config"] = config
        log.info("[%s] A/B orchestration complete -- %d active tests, %d completed",
                 self.name, len(config["active_tests"]), len(config.get("completed_tests", [])))
        return state
