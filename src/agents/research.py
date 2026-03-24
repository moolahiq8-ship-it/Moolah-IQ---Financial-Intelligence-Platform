"""Research Agent -- Google Gemini API.

Gathers topic research, audience pain points, competitor gaps, key
statistics, and matches a war story from the local data store.
"""

from __future__ import annotations

import json
import logging
import os
import pathlib
import time
from typing import Any

from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI

from src.state import PipelineState

load_dotenv()
log = logging.getLogger(__name__)

MAX_RETRIES = 3
WAR_STORIES_PATH = pathlib.Path(__file__).resolve().parents[2] / "data" / "war_stories.json"

SYSTEM_PROMPT = """\
You are the Moolah IQ Research Agent.

Given a personal-finance TOPIC and its PILLAR, produce a JSON research brief
with EXACTLY these keys (no markdown, no extra text -- raw JSON only):

{
  "summary": "2-3 paragraph research summary covering the topic landscape",
  "audience_pain_points": ["pain point 1", "pain point 2", "pain point 3"],
  "competitor_gaps": ["gap 1", "gap 2"],
  "key_stats": [
    {"stat": "description of the statistic", "value": "the number or fact", "source": "source name"}
  ],
  "suggested_angle": "the best unique angle for a Moolah IQ video on this topic",
  "search_volume_estimate": "high / medium / low",
  "recommended_pillar": "the pillar that best fits (one of EARN, SAVE, SPEND, INVEST, PROTECT, BORROW, LEGACY, MILESTONES)"
}

Return ONLY valid JSON.  No explanation before or after.
"""


class ResearchAgent:
    """Discovers and validates content topics via Google Gemini."""

    def __init__(self) -> None:
        self.name = "research"
        api_key = os.getenv("GEMINI_API_KEY")
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            google_api_key=api_key,
            temperature=0.3,
        ) if api_key else None
        self.war_stories = self._load_war_stories()
        log.info("[%s] Initialized (gemini=%s, war_stories=%d)",
                 self.name, "ready" if self.llm else "NO API KEY", len(self.war_stories))

    # -- Helpers ---------------------------------------------------------------

    @staticmethod
    def _load_war_stories() -> list[dict[str, Any]]:
        try:
            return json.loads(WAR_STORIES_PATH.read_text(encoding="utf-8"))
        except FileNotFoundError:
            log.warning("war_stories.json not found at %s", WAR_STORIES_PATH)
            return []

    def _match_war_story(self, topic: str, pillar: str) -> dict[str, Any] | None:
        """Pick the best war story by pillar overlap, then tag keyword overlap."""
        topic_lower = topic.lower()

        # Score each story: +10 per matching pillar, +1 per tag keyword in topic
        scored: list[tuple[int, dict[str, Any]]] = []
        for ws in self.war_stories:
            score = 0
            for p in ws.get("pillars", []):
                if p.upper() == pillar.upper():
                    score += 10
            for tag in ws.get("tags", []):
                if tag.replace("-", " ") in topic_lower:
                    score += 1
            scored.append((score, ws))

        scored.sort(key=lambda x: x[0], reverse=True)
        if scored and scored[0][0] > 0:
            return scored[0][1]
        # Fallback: return the first story if nothing matched
        return self.war_stories[0] if self.war_stories else None

    def _call_llm(self, messages: list) -> str:
        """Invoke the LLM with exponential-backoff retry."""
        if not self.llm:
            raise RuntimeError("GEMINI_API_KEY not set -- cannot call Gemini")
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
        return ""  # unreachable, keeps type checker happy

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
        """Return realistic mock research data for dry-run testing."""
        topic = state.get("topic", "Emergency Fund Basics")
        pillar = state.get("pillar", "SAVE")
        log.info("[%s] MOCK MODE -- returning stub research for '%s'", self.name, topic)

        war_story = self.war_stories[0] if self.war_stories else {
            "id": "WS-MOCK", "title": "Mock War Story", "pillars": [pillar],
            "principle": "Always have a financial cushion",
            "emotional_arc": "comfort → shock → resolve",
            "lesson": "Build your emergency fund before investing.",
            "tags": ["emergency-fund"],
        }

        state["pillar"] = pillar
        state.setdefault("metadata", {})["research"] = {
            "summary": (
                f"Research on '{topic}' reveals strong audience demand among adults 30-55. "
                f"The {pillar} pillar aligns well with current economic conditions. "
                f"Key pain points include lack of actionable steps and overwhelming jargon in existing content."
            ),
            "key_stats": [
                {"stat": "Americans with no emergency savings", "value": "22%", "source": "Federal Reserve"},
                {"stat": "Median emergency fund balance", "value": "$4,800", "source": "Bankrate 2025 Survey"},
                {"stat": "Average unexpected expense", "value": "$1,400", "source": "Bureau of Labor Statistics"},
            ],
            "sources": ["Federal Reserve", "Bankrate 2025 Survey", "Bureau of Labor Statistics"],
            "audience_pain_points": [
                "Don't know how much to save for emergencies",
                "Feel overwhelmed by conflicting advice on where to keep the fund",
                "Struggle to balance saving with paying down debt",
            ],
            "competitor_gaps": [
                "Most videos focus on theory, not step-by-step action plans",
                "Few creators address the emotional side of financial insecurity",
            ],
            "suggested_angle": f"The 3-step emergency fund framework that actually works for {pillar.lower()} goals",
            "search_volume_estimate": "high",
            "war_story_match": war_story,
        }
        log.info("[%s] MOCK research complete", self.name)
        return state

    def run(self, state: PipelineState) -> PipelineState:
        """Execute research phase and return enriched state."""
        if state.get("mock_mode"):
            return self._mock_run(state)

        topic = state.get("topic", "<none>")
        pillar = state.get("pillar", "EARN")
        log.info("[%s] Researching topic='%s' pillar='%s'", self.name, topic, pillar)

        # -- Match war story (local, no LLM needed) ---------------------------
        war_story = self._match_war_story(topic, pillar)
        log.info("[%s] Matched war story: %s", self.name,
                 war_story["id"] if war_story else "none")

        # -- Call Gemini for topic research ------------------------------------
        research_brief: dict[str, Any] = {}
        try:
            user_prompt = (
                f"Research this personal-finance topic for a YouTube video:\n"
                f"TOPIC: {topic}\n"
                f"PILLAR: {pillar}\n"
                f"TARGET AUDIENCE: adults 30-55, homeowners, small investors, "
                f"people navigating financial milestones\n\n"
                f"Provide current statistics, audience pain points, competitor "
                f"gaps in existing YouTube content, and suggest the best angle."
            )
            raw = self._call_llm([
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=user_prompt),
            ])
            research_brief = self._parse_json(raw)
            log.info("[%s] Research brief parsed -- %d keys", self.name, len(research_brief))
        except Exception as exc:
            log.error("[%s] Research LLM call failed: %s -- using minimal brief", self.name, exc)
            research_brief = {
                "summary": f"Research unavailable for '{topic}'. Proceeding with defaults.",
                "audience_pain_points": [],
                "competitor_gaps": [],
                "key_stats": [],
                "suggested_angle": topic,
                "search_volume_estimate": "unknown",
                "recommended_pillar": pillar,
            }

        # -- Update state ------------------------------------------------------
        state["pillar"] = research_brief.get("recommended_pillar", pillar).upper()
        state.setdefault("metadata", {})["research"] = {
            "summary": research_brief.get("summary", ""),
            "key_stats": research_brief.get("key_stats", []),
            "sources": [s.get("source", "") for s in research_brief.get("key_stats", [])],
            "audience_pain_points": research_brief.get("audience_pain_points", []),
            "competitor_gaps": research_brief.get("competitor_gaps", []),
            "suggested_angle": research_brief.get("suggested_angle", ""),
            "search_volume_estimate": research_brief.get("search_volume_estimate", ""),
            "war_story_match": war_story,
        }

        log.info("[%s] Research complete -- pillar=%s, war_story=%s",
                 self.name, state["pillar"],
                 war_story["id"] if war_story else "none")
        return state
