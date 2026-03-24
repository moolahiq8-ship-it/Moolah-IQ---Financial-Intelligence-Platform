"""Decision Agent -- Ollama llama4:16x17b (local).

Evaluates the research brief and decides whether to proceed, pivot,
or reject the topic based on brand alignment, audience fit, and
content-gap analysis.
"""

from __future__ import annotations

import json
import logging
import os
import time
from typing import Any

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_ollama import ChatOllama

from src.state import PipelineState

load_dotenv()
log = logging.getLogger(__name__)

MAX_RETRIES = 3

SYSTEM_PROMPT = """\
You are the Moolah IQ Decision Agent.

Given a research brief for a personal-finance YouTube video, evaluate the topic
and return a GO/NO-GO decision as JSON with EXACTLY these keys:

{
  "approved": true or false,
  "alignment_score": 0-100 (how well the topic fits the Moolah IQ brand),
  "demand_score": 0-100 (audience search volume and pain-point intensity),
  "gap_score": 0-100 (how few quality competitors exist on YouTube),
  "composite_score": 0-100 (weighted: alignment 35%, demand 40%, gap 25%),
  "angle": "the specific angle to take for this video",
  "target_length_minutes": 8-12,
  "confidence_score": 0-100,
  "reasoning": "2-3 sentence explanation of your decision",
  "war_story_fit": "why the matched war story works (or a better suggestion)"
}

RULES:
- Approve (true) only if composite_score >= 65.
- Be decisive. The pipeline halts or continues based on your verdict.
- Return ONLY valid JSON. No markdown fences, no extra text.
"""


class DecisionAgent:
    """Local LLM-based go/no-go gate for content topics."""

    def __init__(self) -> None:
        self.name = "decision"
        self.model = "llama4:16x17b"
        self.ollama_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.llm = ChatOllama(
            model=self.model,
            base_url=self.ollama_url,
            temperature=0.2,
        )
        log.info("[%s] Initialized (model=%s, url=%s)", self.name, self.model, self.ollama_url)

    # -- Helpers ---------------------------------------------------------------

    def _call_llm(self, messages: list) -> str:
        """Invoke Ollama with exponential-backoff retry."""
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = self.llm.invoke(messages)
                return response.content
            except Exception as exc:
                log.warning("[%s] LLM call failed (attempt %d/%d): %s",
                            self.name, attempt, MAX_RETRIES, exc)
                if attempt == MAX_RETRIES:
                    raise
                time.sleep(2 ** attempt)
        return ""

    @staticmethod
    def _parse_json(text: str) -> dict[str, Any]:
        """Extract JSON from LLM output, handling markdown fences."""
        cleaned = text.strip()
        if "```json" in cleaned:
            cleaned = cleaned.split("```json", 1)[1].split("```", 1)[0]
        elif "```" in cleaned:
            cleaned = cleaned.split("```", 1)[1].split("```", 1)[0]
        return json.loads(cleaned.strip())

    # -- Main entry point ------------------------------------------------------

    def _mock_run(self, state: PipelineState) -> PipelineState:
        """Return realistic mock decision data for dry-run testing."""
        topic = state.get("topic", "<none>")
        pillar = state.get("pillar", "EARN")
        research = state.get("metadata", {}).get("research", {})
        log.info("[%s] MOCK MODE -- returning GO decision for '%s'", self.name, topic)

        state.setdefault("metadata", {})["decision"] = {
            "approved": True,
            "angle": research.get("suggested_angle", f"Practical guide to {topic}"),
            "target_pillar": pillar,
            "target_length_minutes": 10,
            "alignment_score": 82,
            "demand_score": 78,
            "gap_score": 71,
            "composite_score": 77,
            "confidence_score": 85,
            "reasoning": (
                f"Topic '{topic}' scores well across all dimensions. High demand (78) with "
                f"strong brand alignment (82) to the {pillar} pillar. Moderate content gap (71) "
                f"suggests opportunity for a differentiated angle using our war story approach."
            ),
            "war_story_fit": "The matched war story provides strong emotional resonance and a clear lesson.",
        }
        log.info("[%s] MOCK decision: GO (composite=77)", self.name)
        return state

    def run(self, state: PipelineState) -> PipelineState:
        """Evaluate topic and attach decision metadata."""
        if state.get("mock_mode"):
            return self._mock_run(state)

        topic = state.get("topic", "<none>")
        pillar = state.get("pillar", "EARN")
        research = state.get("metadata", {}).get("research", {})
        log.info("[%s] Evaluating topic='%s' pillar='%s'", self.name, topic, pillar)

        # -- Build the research brief for the LLM -----------------------------
        war_story = research.get("war_story_match", {})
        brief = (
            f"TOPIC: {topic}\n"
            f"PILLAR: {pillar}\n\n"
            f"RESEARCH SUMMARY:\n{research.get('summary', 'No research available.')}\n\n"
            f"AUDIENCE PAIN POINTS:\n"
        )
        for pp in research.get("audience_pain_points", []):
            brief += f"- {pp}\n"
        brief += f"\nCOMPETITOR GAPS:\n"
        for gap in research.get("competitor_gaps", []):
            brief += f"- {gap}\n"
        brief += f"\nKEY STATS:\n"
        for stat in research.get("key_stats", []):
            brief += f"- {stat.get('stat', '')}: {stat.get('value', '')} (source: {stat.get('source', 'N/A')})\n"
        brief += f"\nSEARCH VOLUME ESTIMATE: {research.get('search_volume_estimate', 'unknown')}\n"
        brief += f"\nMATCHED WAR STORY:\n"
        if war_story:
            brief += (
                f"  ID: {war_story.get('id')}\n"
                f"  Title: {war_story.get('title')}\n"
                f"  Principle: {war_story.get('principle')}\n"
                f"  Pillars: {', '.join(war_story.get('pillars', []))}\n"
            )
        else:
            brief += "  No matching war story found.\n"

        # -- Call Ollama -------------------------------------------------------
        decision: dict[str, Any] = {}
        try:
            raw = self._call_llm([
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=brief),
            ])
            decision = self._parse_json(raw)
            log.info("[%s] Decision parsed -- approved=%s composite=%s",
                     self.name, decision.get("approved"), decision.get("composite_score"))
        except Exception as exc:
            log.error("[%s] Decision LLM call failed: %s -- defaulting to GO", self.name, exc)
            decision = {
                "approved": True,
                "alignment_score": 70,
                "demand_score": 70,
                "gap_score": 70,
                "composite_score": 70,
                "angle": research.get("suggested_angle", topic),
                "target_length_minutes": 10,
                "confidence_score": 50,
                "reasoning": f"Defaulting to GO due to LLM failure: {exc}",
                "war_story_fit": "Using matched story as-is.",
            }

        # -- Enforce composite threshold ---------------------------------------
        composite = decision.get("composite_score", 0)
        if isinstance(composite, (int, float)):
            decision["approved"] = composite >= 65
        else:
            decision["approved"] = True

        # -- Update state ------------------------------------------------------
        state.setdefault("metadata", {})["decision"] = {
            "approved": decision.get("approved", True),
            "angle": decision.get("angle", topic),
            "target_pillar": decision.get("recommended_pillar", pillar),
            "target_length_minutes": decision.get("target_length_minutes", 10),
            "alignment_score": decision.get("alignment_score", 0),
            "demand_score": decision.get("demand_score", 0),
            "gap_score": decision.get("gap_score", 0),
            "composite_score": composite,
            "confidence_score": decision.get("confidence_score", 0),
            "reasoning": decision.get("reasoning", ""),
            "war_story_fit": decision.get("war_story_fit", ""),
        }

        approved = decision.get("approved", True)
        log.info("[%s] Decision: %s (composite=%s, confidence=%s)",
                 self.name,
                 "GO" if approved else "NO-GO",
                 composite,
                 decision.get("confidence_score", 0))
        return state
