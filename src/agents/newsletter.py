"""Newsletter Agent -- Claude Opus 4.6 API.

Transforms the blog post and script into a Beehiiv-ready newsletter
edition tailored for email delivery.
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
You are the Moolah IQ Newsletter Agent powered by Claude Opus 4.6.

Given the blog post and script for a Moolah IQ YouTube video, produce a
Beehiiv-ready newsletter edition.

Return your output in EXACTLY this format (use these exact markers):

===SUBJECT===
(max 50 characters, curiosity-driven, no clickbait)
===END_SUBJECT===

===PREVIEW===
(max 90 characters, complements but does NOT repeat the subject line)
===END_PREVIEW===

===BODY===
(The newsletter body in clean HTML suitable for Beehiiv. Structure:)

<p>Hey {{first_name}},</p>

<p>(Personal greeting referencing the topic -- 1-2 sentences)</p>

<p>(Key insight from the war story -- condensed to 2-3 sentences)</p>

<h3>3 Things You Need to Know</h3>
<ol>
  <li>(Takeaway 1 -- actionable, specific)</li>
  <li>(Takeaway 2 -- actionable, specific)</li>
  <li>(Takeaway 3 -- actionable, specific)</li>
</ol>

<p><a href="{{blog_url}}">Read the full breakdown on the blog</a></p>

<p><a href="{{youtube_url}}">Watch this week's video</a></p>

<p>PS: (A question that drives replies -- something personal and relevant)</p>
===END_BODY===

RULES:
- Total word count MUST be under 500.
- Tone: like a smart friend sharing what they learned this week.
- No financial advice. Include: "As always, this is education, not advice."
- Use {{first_name}}, {{blog_url}}, {{youtube_url}} as template variables.
"""


class NewsletterAgent:
    """Generates Beehiiv-ready email newsletter from blog + script content."""

    def __init__(self) -> None:
        self.name = "newsletter"
        api_key = os.getenv("ANTHROPIC_API_KEY")
        self.llm = ChatAnthropic(
            model="claude-opus-4-6",
            api_key=api_key,
            temperature=0.6,
            max_tokens=2048,
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
    def _extract_section(text: str, start_tag: str, end_tag: str) -> str:
        """Extract content between section markers."""
        if start_tag in text and end_tag in text:
            return text.split(start_tag, 1)[1].split(end_tag, 1)[0].strip()
        return ""

    # -- Main entry point ------------------------------------------------------

    def _mock_run(self, state: PipelineState) -> PipelineState:
        """Return realistic mock newsletter for dry-run testing."""
        topic = state.get("topic", "<none>")
        log.info("[%s] MOCK MODE -- generating newsletter for '%s'", self.name, topic)

        subject = "One pipe burst. $47K gone."
        preview = "The gap in your safety net you haven't checked yet"
        body = """<p>Hey {{first_name}},</p>

<p>This week I learned about a family who lost their entire emergency fund overnight — not to a market crash, but to a pipe burst their insurance refused to cover.</p>

<p>The exclusion was buried on page 34 of their policy. They never knew it existed until it was too late.</p>

<h3>3 Things You Need to Know</h3>
<ol>
  <li>Audit every insurance exclusion — call your agent and ask what is NOT covered. That list matters more than what is.</li>
  <li>Build a 3-month emergency runway in a high-yield savings account (4-5% APY). Start with $1,000 and automate $200/month.</li>
  <li>Run a financial fire drill every quarter — simulate a $2,000 emergency and see if you can handle it without credit cards.</li>
</ol>

<p>As always, this is education, not advice.</p>

<p><a href="{{blog_url}}">Read the full breakdown on the blog</a></p>

<p><a href="{{youtube_url}}">Watch this week's video</a></p>

<p>PS: When's the last time you actually read your insurance policy? Hit reply and let me know — I read every response.</p>"""

        state["newsletter"] = body
        state.setdefault("metadata", {})["newsletter"] = {
            "subject": subject,
            "preview_text": preview,
            "body_html": body,
            "provider": "beehiiv",
        }
        log.info("[%s] MOCK newsletter generated -- subject='%s' body=%d words",
                 self.name, subject, len(body.split()))
        return state

    def run(self, state: PipelineState) -> PipelineState:
        """Create newsletter edition from blog + script content."""
        if state.get("mock_mode"):
            return self._mock_run(state)

        topic = state.get("topic", "<none>")
        pillar = state.get("pillar", "EARN")
        script = state.get("script", "")
        blog = state.get("blog", "")
        research = state.get("metadata", {}).get("research", {})
        war_story = research.get("war_story_match", {})

        log.info("[%s] Generating newsletter for topic='%s'", self.name, topic)

        # -- Build user prompt -------------------------------------------------
        user_prompt = f"TOPIC: {topic}\nPILLAR: {pillar}\n\n"

        if war_story:
            user_prompt += "WAR STORY (condense for the newsletter):\n"
            user_prompt += f"  Title: {war_story.get('title', '')}\n"
            user_prompt += f"  Principle: {war_story.get('principle', '')}\n"
            user_prompt += f"  Lesson: {war_story.get('lesson', '')}\n\n"

        user_prompt += "SCRIPT (for context):\n"
        # Truncate to keep prompt manageable
        user_prompt += (script[:3000] + "..." if len(script) > 3000 else script) + "\n\n"

        user_prompt += "BLOG POST (for context):\n"
        user_prompt += (blog[:3000] + "..." if len(blog) > 3000 else blog) + "\n\n"

        user_prompt += "Generate the newsletter edition now."

        # -- Call Claude -------------------------------------------------------
        try:
            raw = self._call_llm([
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=user_prompt),
            ])

            subject = self._extract_section(raw, "===SUBJECT===", "===END_SUBJECT===")
            preview = self._extract_section(raw, "===PREVIEW===", "===END_PREVIEW===")
            body = self._extract_section(raw, "===BODY===", "===END_BODY===")

            # Fallback if markers weren't used
            if not body:
                log.warning("[%s] Section markers not found -- using raw response", self.name)
                body = raw
                subject = topic[:50]
                preview = f"This week: {topic}"[:90]

            # Store structured newsletter data
            newsletter_data = {
                "subject": subject,
                "preview_text": preview,
                "body_html": body,
                "provider": os.getenv("NEWSLETTER_PROVIDER", "beehiiv"),
            }

            # The state "newsletter" field is a string; store the full body
            # but keep structured data in metadata for the publishing agent
            state["newsletter"] = body
            state.setdefault("metadata", {})["newsletter"] = newsletter_data

            word_count = len(body.split())
            log.info("[%s] Newsletter generated -- subject='%s' body=%d words",
                     self.name, subject[:40], word_count)

            if word_count > 500:
                log.warning("[%s] Newsletter body exceeds 500 word target (%d words)",
                            self.name, word_count)

        except Exception as exc:
            log.error("[%s] Newsletter generation failed: %s", self.name, exc)
            state["newsletter"] = f"[ERROR] Newsletter generation failed: {exc}"

        return state
