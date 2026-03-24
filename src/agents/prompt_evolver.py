"""Prompt Evolver Agent — Meta-intelligence that improves all other agents.

Rewrites agent system prompts based on Insight Synthesizer findings.
Maintains versioned prompt history. Conservative: 1 change per agent per week.
Validates improvements via A/B testing before full deployment.

V3.8.3.3 — Self-Improvement Layer Stage 3.
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
INSIGHT_REPORT_PATH = DATA_DIR / "insight_report.json"
PROMPT_HISTORY_PATH = DATA_DIR / "prompt_history.json"
UPDATED_PROMPTS_PATH = DATA_DIR / "updated_prompts.json"

# Agents whose prompts CAN be evolved
EVOLVABLE_AGENTS = ["content", "research", "production", "decision", "seo"]

# Rules that are PERMANENTLY LOCKED (never evolved)
LOCKED_RULES = [
    "Universal framing rules (no local market references)",
    "Compliance and disclaimer requirements",
    "Anti-hype protocol and superlative ban",
    "5-credential authority stack structure",
    "QC checklist core checks #1-50",
]

MAX_CHANGES_PER_AGENT = 1


class PromptEvolverAgent:
    """Evolves agent prompts based on performance insights."""

    def __init__(self) -> None:
        self.name = "prompt_evolver"
        log.info("[%s] Initialized -- evolvable agents: %s", self.name, EVOLVABLE_AGENTS)

    def _load_insight_report(self) -> dict[str, Any]:
        """Load the latest insight report."""
        if INSIGHT_REPORT_PATH.exists():
            try:
                return json.loads(INSIGHT_REPORT_PATH.read_text())
            except Exception:
                return {}
        return {}

    def _load_prompt_history(self) -> list[dict[str, Any]]:
        """Load versioned prompt history."""
        if PROMPT_HISTORY_PATH.exists():
            try:
                return json.loads(PROMPT_HISTORY_PATH.read_text())
            except Exception:
                return []
        return []

    def _save_prompt_history(self, history: list[dict[str, Any]]) -> None:
        """Persist prompt history."""
        PROMPT_HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
        PROMPT_HISTORY_PATH.write_text(json.dumps(history, indent=2, default=str))

    def _generate_evolution(self, agent: str, insights: dict) -> dict[str, Any] | None:
        """Generate a prompt evolution for an agent based on insights.

        TODO: Implement Ollama llama4:16x17b call to generate evolved prompts.
        For now returns None (no evolution) until sufficient data exists.
        """
        weight_updates = insights.get("weight_updates", {})
        if not weight_updates:
            return None

        return {
            "agent": agent,
            "change_type": "weight_adjustment",
            "rationale": f"Insight Synthesizer recommended weight updates: {weight_updates}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "requires_ab_test": True,
        }

    def _mock_run(self, state: PipelineState) -> PipelineState:
        """Return mock evolution for dry-run testing."""
        log.info("[%s] MOCK MODE -- no prompt evolutions generated", self.name)
        state.setdefault("improvement_cycle_status", {})["evolve"] = "complete"
        state.setdefault("prompt_version", {})
        return state

    def run(self, state: PipelineState) -> PipelineState:
        """Evolve agent prompts based on insight report."""
        if state.get("mock_mode"):
            return self._mock_run(state)

        log.info("[%s] Starting prompt evolution cycle", self.name)

        insights = self._load_insight_report()
        if not insights:
            log.info("[%s] No insight report available -- skipping evolution", self.name)
            state.setdefault("improvement_cycle_status", {})["evolve"] = "skipped:no_insights"
            return state

        history = self._load_prompt_history()
        evolutions = []

        for agent in EVOLVABLE_AGENTS:
            evolution = self._generate_evolution(agent, insights)
            if evolution:
                history.append(evolution)
                evolutions.append(evolution)
                log.info("[%s] Generated evolution for %s: %s",
                         self.name, agent, evolution.get("change_type"))

        if evolutions:
            self._save_prompt_history(history)
            UPDATED_PROMPTS_PATH.parent.mkdir(parents=True, exist_ok=True)
            UPDATED_PROMPTS_PATH.write_text(json.dumps(evolutions, indent=2, default=str))

        state.setdefault("improvement_cycle_status", {})["evolve"] = "complete"
        state.setdefault("prompt_version", {})
        log.info("[%s] Evolution complete -- %d changes generated", self.name, len(evolutions))
        return state
