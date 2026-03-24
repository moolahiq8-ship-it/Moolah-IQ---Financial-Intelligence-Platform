"""Optimization Agent -- Closed-Loop Feedback via Claude Opus 4.6.

Analyzes analytics data and failure memory, then generates actionable
recommendations for the next content cycle.  Writes lessons learned
back to failure_memory for future pipeline runs.
"""

from __future__ import annotations

import json
import logging
import os
import time
from datetime import datetime, timezone
from typing import Any

from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

from src.state import PipelineState

load_dotenv()
log = logging.getLogger(__name__)

MAX_RETRIES = 3

SYSTEM_PROMPT = """\
You are the Moolah IQ Optimization Agent powered by Claude Opus 4.6.

Given analytics data from a published video, blog post, newsletter, and social
posts, plus any prior failure_memory entries, generate optimization
recommendations.

Return ONLY valid JSON with EXACTLY these keys:

{
  "title_recommendation": "Specific recommendation for improving YouTube titles based on CTR data",
  "thumbnail_recommendation": "Specific recommendation for improving thumbnails",
  "topic_recommendations": [
    {"topic": "Suggested topic 1", "pillar": "PILLAR", "reasoning": "Why this topic"},
    {"topic": "Suggested topic 2", "pillar": "PILLAR", "reasoning": "Why this topic"},
    {"topic": "Suggested topic 3", "pillar": "PILLAR", "reasoning": "Why this topic"}
  ],
  "script_adjustments": "Recommendations for script structure based on watch-time data",
  "seo_refinements": "Recommendations for SEO strategy based on search performance",
  "production_tweaks": "Recommendations for pacing, visuals, audio based on retention",
  "lessons_learned": [
    {"pattern": "What underperformed", "impact": "How it affected metrics", "fix": "What to do differently"}
  ],
  "overall_score": "1-10 rating of this content cycle's performance",
  "summary": "2-3 sentence executive summary of findings"
}

RULES:
- Base recommendations on actual data, not generic advice.
- If data is unavailable (zeros), note that and provide recommendations based
  on the content quality you can infer from the brief.
- Each lesson_learned entry should be specific enough to be actionable.
- Topic recommendations should be informed by what performed well.
- Return ONLY valid JSON. No markdown fences, no extra text.
"""


class OptimizationAgent:
    """Generates closed-loop feedback from analytics + failure memory."""

    def __init__(self) -> None:
        self.name = "optimization"
        api_key = os.getenv("ANTHROPIC_API_KEY")
        self.llm = ChatAnthropic(
            model="claude-opus-4-6",
            api_key=api_key,
            temperature=0.5,
            max_tokens=4096,
        ) if api_key else None
        log.info("[%s] Initialized (claude=%s)", self.name, "ready" if self.llm else "NO API KEY")

    # -- Helpers ---------------------------------------------------------------

    def _call_llm(self, messages: list) -> str:
        """Invoke Claude with exponential-backoff retry."""
        if not self.llm:
            raise RuntimeError("ANTHROPIC_API_KEY not set -- cannot call Claude")
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
        """Return realistic mock optimization recommendations for dry-run testing."""
        topic = state.get("topic", "<none>")
        pillar = state.get("pillar", "EARN")
        correction_count = state.get("correction_count", 0)
        log.info("[%s] MOCK MODE -- generating optimization recommendations", self.name)

        optimization = {
            "title_recommendation": "Current title CTR of 6.8% is above channel average. Consider A/B testing title B variant for 24h.",
            "thumbnail_recommendation": "High-contrast stat overlay ('22% have $0') performs well. Test adding a face + emotion for higher CTR.",
            "topic_recommendations": [
                {"topic": "High-Yield Savings Accounts Ranked 2026", "pillar": "SAVE", "reasoning": "Natural follow-up to emergency fund content; high search volume."},
                {"topic": "Insurance Gaps That Could Cost You Thousands", "pillar": "PROTECT", "reasoning": "Directly extends the Gap Principle from this video."},
                {"topic": "5 Money Milestones Before 40", "pillar": "MILESTONES", "reasoning": "Audience demographic (30-55) responds well to age-gated content."},
            ],
            "script_adjustments": "Watch time data (385s avg) suggests viewers drop at the Solution section. Consider leading with the most impactful step first.",
            "seo_refinements": "Primary keyword 'emergency fund' ranking well. Add long-tail variant 'emergency fund for beginners' to next video's tags.",
            "production_tweaks": "Consider adding on-screen stat callouts during the Problem section to boost retention during data-heavy segments.",
            "lessons_learned": [
                {"pattern": "QC retry triggered on first pass", "impact": f"Added 1 correction round ({correction_count} total)", "fix": "Pre-check disclaimer and step count in content prompt."},
                {"pattern": "Strong newsletter engagement (42% open)", "impact": "Above industry average (21%)", "fix": "Continue curiosity-driven subject lines with specific numbers."},
            ],
            "overall_score": 7,
            "summary": f"Content cycle for '{topic}' performed well across platforms. YouTube CTR (6.8%) and newsletter open rate (42%) exceeded benchmarks. Main area for improvement: script pacing in the Solution section to reduce mid-video drop-off.",
        }

        # Write lessons to failure_memory
        timestamp = datetime.now(timezone.utc).isoformat()
        for lesson in optimization.get("lessons_learned", []):
            lesson["topic"] = topic
            lesson["pillar"] = pillar
            lesson["timestamp"] = timestamp
        state.setdefault("failure_memory", []).extend(optimization["lessons_learned"])

        state.setdefault("metadata", {})["optimization"] = {
            "title_recommendation": optimization["title_recommendation"],
            "thumbnail_recommendation": optimization["thumbnail_recommendation"],
            "topic_recommendations": optimization["topic_recommendations"],
            "script_adjustments": optimization["script_adjustments"],
            "seo_refinements": optimization["seo_refinements"],
            "production_tweaks": optimization["production_tweaks"],
            "overall_score": optimization["overall_score"],
            "summary": optimization["summary"],
        }
        log.info("[%s] MOCK optimization complete -- score=%s", self.name, optimization["overall_score"])
        return state

    def run(self, state: PipelineState) -> PipelineState:
        """Analyze performance and generate recommendations."""
        if state.get("mock_mode"):
            return self._mock_run(state)

        log.info("[%s] Analyzing performance data", self.name)

        topic = state.get("topic", "<none>")
        pillar = state.get("pillar", "EARN")
        metadata = state.get("metadata", {})
        analytics = metadata.get("analytics", {})
        failure_memory = state.get("failure_memory", [])
        correction_count = state.get("correction_count", 0)

        # -- Build the analysis brief ------------------------------------------
        brief = f"TOPIC: {topic}\nPILLAR: {pillar}\n"
        brief += f"QC CORRECTION ROUNDS: {correction_count}\n\n"

        # Analytics data
        brief += "ANALYTICS DATA:\n"
        yt = analytics.get("youtube", {})
        brief += f"  YouTube: views_48h={yt.get('views_48h', 0)}, "
        brief += f"likes={yt.get('likes', 0)}, comments={yt.get('comments', 0)}, "
        brief += f"CTR={yt.get('ctr', 0)}, avg_watch_time={yt.get('avg_watch_time_seconds', 0)}s, "
        brief += f"subscriber_delta={yt.get('subscriber_delta', 0)}\n"

        nl = analytics.get("newsletter", {})
        brief += f"  Newsletter: open_rate={nl.get('open_rate', 0)}, "
        brief += f"click_rate={nl.get('click_rate', 0)}, "
        brief += f"unsubscribes={nl.get('unsubscribe_rate', 0)}\n"

        social = analytics.get("social", {})
        brief += f"  Social: impressions={social.get('total_impressions', 0)}, "
        brief += f"engagement={social.get('engagement_rate', 0)}, "
        brief += f"clicks={social.get('click_throughs', 0)}\n"

        blog = analytics.get("blog", {})
        brief += f"  Blog: page_views={blog.get('page_views', 0)}, "
        brief += f"avg_time={blog.get('avg_time_on_page_seconds', 0)}s, "
        brief += f"bounce={blog.get('bounce_rate', 0)}\n\n"

        # SEO metadata context
        brief += "SEO METADATA USED:\n"
        brief += f"  Title A: {metadata.get('youtube_title_a', 'N/A')}\n"
        brief += f"  Title B: {metadata.get('youtube_title_b', 'N/A')}\n"
        brief += f"  Primary keyword: {metadata.get('primary_keyword', 'N/A')}\n"
        brief += f"  Tags count: {len(metadata.get('youtube_tags', []))}\n\n"

        # Prior failure memory
        if failure_memory:
            brief += f"PRIOR FAILURE MEMORY ({len(failure_memory)} entries):\n"
            for entry in failure_memory[-5:]:  # last 5 entries
                brief += f"  - Pattern: {entry.get('pattern', '?')}\n"
                brief += f"    Fix: {entry.get('fix', '?')}\n"
            brief += "\n"

        # QC results summary
        qc_results = state.get("qc_results", [])
        failed_qc = [r for r in qc_results if not r.get("passed")]
        if failed_qc:
            brief += f"QC FAILURES ({len(failed_qc)}):\n"
            for r in failed_qc[:10]:
                brief += f"  - [{r.get('check_id')}] {r.get('name')}: {r.get('reason', '')}\n"
            brief += "\n"

        brief += "Generate optimization recommendations now."

        # -- Call Claude -------------------------------------------------------
        optimization: dict[str, Any] = {}
        try:
            raw = self._call_llm([
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=brief),
            ])
            optimization = self._parse_json(raw)
            log.info("[%s] Optimization analysis parsed -- score=%s",
                     self.name, optimization.get("overall_score", "?"))
        except Exception as exc:
            log.error("[%s] Optimization LLM call failed: %s -- using defaults", self.name, exc)
            optimization = {
                "title_recommendation": "Insufficient data for title recommendation.",
                "thumbnail_recommendation": "Insufficient data for thumbnail recommendation.",
                "topic_recommendations": [
                    {"topic": "Review and optimize existing content", "pillar": pillar,
                     "reasoning": "Optimization analysis unavailable."},
                ],
                "script_adjustments": "Continue current script structure.",
                "seo_refinements": "Continue current SEO strategy.",
                "production_tweaks": "No changes recommended.",
                "lessons_learned": [
                    {"pattern": "Optimization LLM unavailable", "impact": "No data-driven feedback",
                     "fix": f"Ensure ANTHROPIC_API_KEY is set. Error: {exc}"},
                ],
                "overall_score": "N/A",
                "summary": f"Optimization analysis failed: {exc}",
            }

        # -- Write lessons to failure_memory -----------------------------------
        new_lessons = optimization.get("lessons_learned", [])
        if new_lessons:
            timestamp = datetime.now(timezone.utc).isoformat()
            for lesson in new_lessons:
                lesson["topic"] = topic
                lesson["pillar"] = pillar
                lesson["timestamp"] = timestamp
            state.setdefault("failure_memory", []).extend(new_lessons)
            log.info("[%s] Added %d lesson(s) to failure_memory (total: %d)",
                     self.name, len(new_lessons), len(state["failure_memory"]))

        # -- Update state metadata ---------------------------------------------
        state.setdefault("metadata", {})["optimization"] = {
            "title_recommendation": optimization.get("title_recommendation", ""),
            "thumbnail_recommendation": optimization.get("thumbnail_recommendation", ""),
            "topic_recommendations": optimization.get("topic_recommendations", []),
            "script_adjustments": optimization.get("script_adjustments", ""),
            "seo_refinements": optimization.get("seo_refinements", ""),
            "production_tweaks": optimization.get("production_tweaks", ""),
            "overall_score": optimization.get("overall_score", "N/A"),
            "summary": optimization.get("summary", ""),
        }

        log.info("[%s] Optimization complete -- score=%s, next_topics=%d, lessons=%d",
                 self.name,
                 optimization.get("overall_score", "?"),
                 len(optimization.get("topic_recommendations", [])),
                 len(new_lessons))
        return state
