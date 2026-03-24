"""SEO & Linking Agent -- Claude Opus 4.6 API.

Optimizes all content artifacts for search: YouTube metadata,
blog post on-page SEO, internal linking, and schema markup.
"""

from __future__ import annotations

import json
import logging
import os
import time
from typing import Any

from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

from src.state import PipelineState

load_dotenv()
log = logging.getLogger(__name__)

MAX_RETRIES = 3

SYSTEM_PROMPT = """\
You are the Moolah IQ SEO Agent powered by Claude Opus 4.6.

Given the script, blog post, topic, and pillar, generate comprehensive SEO
metadata. Return ONLY valid JSON with EXACTLY these keys:

{
  "youtube_title_a": "Primary title variant (max 60 chars, keyword front-loaded)",
  "youtube_title_b": "A/B test variant (max 60 chars, different hook or structure)",
  "youtube_description": "Full YouTube description (STRICTLY 200-280 words, NEVER exceed 300). MUST start with the primary keyword in the first sentence. Include timestamps, 3 CTAs, blog link, newsletter link. Use actual chapter markers if provided.",
  "youtube_tags": ["tag1", "tag2", "... up to 50 tags mixing head terms and long-tail -- the primary keyword MUST appear verbatim in at least 3 tags"],
  "youtube_hashtags": ["#hashtag1", "#hashtag2", "#hashtag3"],
  "thumbnail_text": "Bold text for the thumbnail overlay (max 5 words, high contrast)",
  "thumbnail_hook": "The emotional/curiosity hook the thumbnail conveys",
  "card_text": "Text for YouTube info cards (max 2 cards, each max 30 chars)",
  "end_screen_cta": "Call-to-action text for the end screen",
  "blog_meta_title": "SEO title for the blog post (max 60 chars)",
  "blog_meta_description": "Meta description for the blog post (max 155 chars)",
  "blog_og_title": "Open Graph title",
  "blog_og_description": "Open Graph description (max 200 chars)",
  "blog_internal_links": [
    {"anchor_text": "text to link", "url": "https://moolahiq.com/pillar-page", "context": "where in the blog to insert"}
  ],
  "primary_keyword": "the primary SEO keyword",
  "secondary_keywords": ["kw1", "kw2", "kw3"],
  "schema_video_object": {
    "name": "video title",
    "description": "video description",
    "duration": "PT10M (ISO 8601)"
  },
  "schema_article": {
    "headline": "blog title",
    "description": "blog description",
    "wordCount": 1500
  }
}

RULES:
- YouTube tags: provide exactly 50, ordered by relevance.
- Front-load the primary keyword in youtube_title_a.
- Blog internal links must point to real Moolah IQ pillar pages:
  https://moolahiq.com/earn, /save, /spend, /invest, /protect, /borrow, /legacy, /milestones
- Include at least 3 internal links.
- Return ONLY valid JSON. No markdown fences, no extra text.
"""


class SEOAgent:
    """Optimizes content for YouTube and blog search visibility."""

    def __init__(self) -> None:
        self.name = "seo"
        api_key = os.getenv("ANTHROPIC_API_KEY")
        self.llm = ChatAnthropic(
            model="claude-opus-4-6",
            api_key=api_key,
            temperature=0.4,
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

    @staticmethod
    def _truncate_to_word_limit(text: str, max_words: int = 300) -> str:
        """Truncate text at the last complete sentence within the word limit."""
        words = text.split()
        if len(words) <= max_words:
            return text
        truncated = " ".join(words[:max_words])
        # Find the last sentence boundary (. ! ?)
        for i in range(len(truncated) - 1, -1, -1):
            if truncated[i] in ".!?":
                return truncated[: i + 1]
        # No sentence boundary found -- hard-truncate at word limit
        return truncated

    # -- Main entry point ------------------------------------------------------

    def _mock_run(self, state: PipelineState) -> PipelineState:
        """Return realistic mock SEO metadata for dry-run testing."""
        topic = state.get("topic", "<none>")
        pillar = state.get("pillar", "EARN")
        log.info("[%s] MOCK MODE -- generating SEO metadata for '%s'", self.name, topic)

        seo_data = {
            "youtube_title_a": f"Emergency Fund: 3 Steps Most People Skip ({pillar})",
            "youtube_title_b": f"Why 22% of Americans Have $0 Saved (Fix It Today)",
            "youtube_description": (
                f"Emergency fund basics: learn the 3-step framework to build your financial safety net. "
                f"22% of Americans have zero emergency savings according to the Federal Reserve. "
                f"The Bankrate 2025 Survey found the median emergency fund balance is just $4,800. "
                f"In this Moolah IQ video, I share a real story about a family who lost $47,000 "
                f"overnight to a single pipe burst because of an insurance exclusion buried on page 34 "
                f"of their policy. You will learn the Gap Principle and the simple 3-step framework "
                f"that could have saved them and can protect you today.\n\n"
                f"Chapters:\n"
                f"00:00 Hook\n00:15 The Problem with Emergency Savings in America\n"
                f"01:15 The Story: One Family's $47,000 Disaster\n"
                f"02:45 The Gap Principle Explained\n"
                f"03:15 3-Step Emergency Fund Framework\n"
                f"05:15 Your Next Step\n\n"
                f"Step 1: Audit your safety nets including insurance exclusions, emergency fund size, "
                f"and total debt exposure. Call your insurance agent and ask for a full exclusion review.\n"
                f"Step 2: Build a 3-month emergency runway starting with $1,000 and automating $200 "
                f"per month into a high-yield savings account earning 4-5% APY.\n"
                f"Step 3: Run a financial fire drill every quarter. Simulate a $2,000 emergency and "
                f"see if you can handle it without credit cards.\n\n"
                f"Subscribe for weekly smart money moves: https://moolahiq.com/newsletter\n"
                f"Read the full blog post: https://moolahiq.com/blog/emergency-fund-basics\n"
                f"Free emergency fund calculator: https://moolahiq.com/calculators/emergency-fund\n\n"
                f"This content is for educational purposes only and does not constitute financial advice. "
                f"Always consult a licensed financial professional before making major money decisions.\n\n"
                f"#personalfinance #emergencyfund #moolahiq\n\n"
                f"Emergency fund, emergency savings, how to save money, personal finance tips, "
                f"financial security, savings account, high yield savings, money tips, budgeting tips, "
                f"financial planning, smart money, debt free living, money management, wealth building, "
                f"save money fast, financial safety net, insurance gaps, unexpected expenses, rainy day fund"
            ),
            "youtube_tags": [
                "emergency fund", "emergency savings", "how to save money", "personal finance",
                "financial security", "savings account", "high yield savings", "money tips",
                "budgeting", "financial planning", "moolah iq", "smart money", "debt free",
                "financial freedom", "money management", "save money fast", "emergency fund basics",
                "3 month savings", "6 month savings", "financial safety net", "insurance gaps",
                "unexpected expenses", "car repair fund", "medical emergency fund", "job loss savings",
            ],
            "youtube_hashtags": ["#personalfinance", "#emergencyfund", "#moolahiq"],
            "thumbnail_text": "YOUR $0 SAFETY NET",
            "thumbnail_hook": "Shock stat + urgency",
            "card_text": "Free Emergency Calculator",
            "end_screen_cta": "Watch: 5 Money Mistakes to Avoid",
            "blog_meta_title": "Emergency Fund Basics: 3-Step Guide | Moolah IQ",
            "blog_meta_description": "Learn the 3-step emergency fund framework. 22% of Americans have $0 saved. Build your financial safety net today.",
            "blog_og_title": "Emergency Fund Basics: The 3-Step Framework",
            "blog_og_description": "22% of Americans have zero savings. Learn the proven 3-step framework to build your emergency fund and close financial gaps.",
            "blog_internal_links": [
                {"anchor_text": "protecting your finances", "url": "https://moolahiq.com/protect", "context": "In the Gap Principle section"},
                {"anchor_text": "savings strategies", "url": "https://moolahiq.com/save", "context": "In the Build Your Runway section"},
                {"anchor_text": "investment basics", "url": "https://moolahiq.com/invest", "context": "In the Final Thoughts section"},
                {"anchor_text": "milestone planning", "url": "https://moolahiq.com/milestones", "context": "In the Related Resources section"},
            ],
            "primary_keyword": "emergency fund",
            "secondary_keywords": ["emergency savings", "financial safety net", "how to save money"],
            "schema_video_object": {
                "name": f"Emergency Fund Basics: 3 Steps Most People Skip",
                "description": "Learn the 3-step emergency fund framework backed by Federal Reserve data.",
                "duration": "PT10M20S",
            },
            "schema_article": {
                "headline": "Emergency Fund Basics: The Complete Guide to Financial Security",
                "description": "Comprehensive guide to building an emergency fund using the 3-step framework.",
                "wordCount": 1500,
            },
        }

        state.setdefault("metadata", {}).update(seo_data)
        log.info("[%s] MOCK SEO complete -- title='%s'", self.name, seo_data["youtube_title_a"])
        return state

    def run(self, state: PipelineState) -> PipelineState:
        """Generate SEO metadata for all content artifacts."""
        if state.get("mock_mode"):
            return self._mock_run(state)

        topic = state.get("topic", "<none>")
        pillar = state.get("pillar", "EARN")
        script = state.get("script", "")
        blog = state.get("blog", "")
        chapters = state.get("metadata", {}).get("chapter_markers", "")

        log.info("[%s] Optimizing SEO for topic='%s' pillar='%s'", self.name, topic, pillar)

        # -- Build user prompt -------------------------------------------------
        user_prompt = f"TOPIC: {topic}\nPILLAR: {pillar}\n\n"

        user_prompt += "SCRIPT (first 2000 chars for keyword analysis):\n"
        user_prompt += (script[:2000] + "..." if len(script) > 2000 else script) + "\n\n"

        user_prompt += "BLOG POST (first 2000 chars for keyword analysis):\n"
        user_prompt += (blog[:2000] + "..." if len(blog) > 2000 else blog) + "\n\n"

        if chapters:
            user_prompt += f"CHAPTER MARKERS:\n{chapters}\n\n"

        user_prompt += (
            "Moolah IQ pillar pages for internal linking:\n"
            "  https://moolahiq.com/earn\n"
            "  https://moolahiq.com/save\n"
            "  https://moolahiq.com/spend\n"
            "  https://moolahiq.com/invest\n"
            "  https://moolahiq.com/protect\n"
            "  https://moolahiq.com/borrow\n"
            "  https://moolahiq.com/legacy\n"
            "  https://moolahiq.com/milestones\n\n"
            "Generate the complete SEO metadata now."
        )

        # -- Call Claude -------------------------------------------------------
        try:
            raw = self._call_llm([
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=user_prompt),
            ])
            seo_data = self._parse_json(raw)
            log.info("[%s] SEO metadata parsed -- %d keys", self.name, len(seo_data))
        except Exception as exc:
            log.error("[%s] SEO generation failed: %s -- using minimal metadata", self.name, exc)
            seo_data = {
                "youtube_title_a": topic[:60],
                "youtube_title_b": f"Moolah IQ: {topic}"[:60],
                "youtube_description": f"Learn about {topic} in this Moolah IQ deep-dive.",
                "youtube_tags": [topic.lower(), pillar.lower(), "personal finance",
                                 "moolah iq", "money tips"],
                "youtube_hashtags": ["#personalfinance", "#moolahiq", f"#{pillar.lower()}"],
                "thumbnail_text": topic.split()[0:3],
                "thumbnail_hook": topic,
                "card_text": "Learn more",
                "end_screen_cta": "Watch the next video",
                "blog_meta_title": topic[:60],
                "blog_meta_description": f"Learn about {topic} -- Moolah IQ"[:155],
                "blog_og_title": topic,
                "blog_og_description": f"Moolah IQ deep-dive: {topic}",
                "blog_internal_links": [],
                "primary_keyword": topic.lower(),
                "secondary_keywords": [],
                "schema_video_object": {"name": topic, "description": topic},
                "schema_article": {"headline": topic, "description": topic},
            }

        # -- Validate key constraints ------------------------------------------
        title_a = seo_data.get("youtube_title_a", "")
        if len(title_a) > 60:
            log.warning("[%s] Title A exceeds 60 chars (%d) -- truncating", self.name, len(title_a))
            seo_data["youtube_title_a"] = title_a[:57] + "..."

        title_b = seo_data.get("youtube_title_b", "")
        if len(title_b) > 60:
            seo_data["youtube_title_b"] = title_b[:57] + "..."

        meta_desc = seo_data.get("blog_meta_description", "")
        if len(meta_desc) > 155:
            seo_data["blog_meta_description"] = meta_desc[:152] + "..."

        # YouTube description: enforce 300-word hard cap
        yt_desc = seo_data.get("youtube_description", "")
        desc_words = len(yt_desc.split())
        if desc_words > 300:
            log.warning("[%s] YouTube description %d words -- truncating to 300", self.name, desc_words)
            seo_data["youtube_description"] = self._truncate_to_word_limit(yt_desc, 300)
            log.info("[%s] Truncated to %d words", self.name, len(seo_data["youtube_description"].split()))

        tags = seo_data.get("youtube_tags", [])
        if len(tags) > 50:
            seo_data["youtube_tags"] = tags[:50]
        log.info("[%s] Tags: %d, Internal links: %d",
                 self.name, len(seo_data.get("youtube_tags", [])),
                 len(seo_data.get("blog_internal_links", [])))

        # -- Update state ------------------------------------------------------
        state.setdefault("metadata", {}).update(seo_data)

        log.info("[%s] SEO complete -- title_a='%s'",
                 self.name, seo_data.get("youtube_title_a", "")[:50])
        return state
