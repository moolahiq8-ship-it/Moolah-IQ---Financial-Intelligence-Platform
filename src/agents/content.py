"""Content Agent -- Claude Opus 4.6 API.

Generates the full YouTube script and companion blog post, weaving in
war stories, data citations, and the Moolah IQ brand voice.
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
You are the Moolah IQ Content Agent powered by Claude Opus 4.6.

Given a topic brief, decision metadata, and a matched war story, produce
content in EXACTLY this format (use these exact section headers):

===SCRIPT_START===
[HOOK]
(3-5 sentences. ONE self-relevant question as a pattern-interrupt opening.)
IMPORTANT: The hook MUST include a spoken financial disclaimer. Work it naturally
into the opening, for example: "Now I'm not a financial advisor, this is not
financial advice, but ..." or "Before we dive in, this is for educational
purposes only and does not constitute financial advice." The disclaimer MUST
appear in the [HOOK] section, not buried elsewhere.

[INTRO]
(8-10 sentences. Channel Anchor + Value Framing.)
Mandatory audio: "Welcome to MOOLAH IQ — where we make personal finance,
investing, and trading simple."
Then state what the viewer will gain: Clarity / Better Decisions. Expand on
the topic's relevance, why it matters right now, and who this video is for.
Set up the journey the viewer is about to take.

[MAIN]
(130-160 sentences. This is the BULK of the video — be detailed and educational.)
Break the topic into 5-7 clear subsections, each with its own mini-narrative.
Cover: background context, data/stats with sources, the war story with FULL
emotional arc (not summarized — tell it scene by scene), a mid-video Pause and
Reflect moment, then 5-7 concrete numbered actionable steps WITH implementation
detail (2-3 sentences per step explaining HOW, not just what).

Each sentence should be a complete, standalone thought. Write in spoken-word
style — short, punchy sentences that sound natural when read aloud. Avoid
compound sentences joined by semicolons or multiple clauses.

CRITICAL FORMATTING RULE: Each step MUST start on its own line with a number
followed by a period and a space. Use EXACTLY this format:
1. First step text here
2. Second step text here
3. Third step text here
Do NOT use words like "Step one" or "First" -- use the digit-period format
(1. 2. 3.) so automated checks can detect them. Provide at least 5 steps.

[CTA]
(5-8 sentences. Conclusion — gentle invite to comment, no pushy sales.)
Mandatory audio: "This is MOOLAH IQ — helping you increase your financial IQ,
one wise decision at a time."
Recap the single most important takeaway. Invite comments with a specific
question. Mention the blog and newsletter.
===SCRIPT_END===

SCRIPT LENGTH — THIS IS CRITICAL:
The script MUST contain 160-200 sentences total across all four sections.
Each sentence becomes a video clip, so short scripts = too few clips = broken video.
Write in spoken-word style: short declarative sentences (8-15 words average).
Avoid packing multiple ideas into one long compound sentence.
Target: 2,000-2,800 words total (12-18 min at 155 WPM).

===BLOG_START===
(1,200-1,800 word blog post with:)
- SEO-optimized H1 at top that includes the primary keyword
- H2/H3 subheadings -- at least 2 subheadings should contain the primary keyword or a close variant
- The same war story with expanded detail
- Internal links to related Moolah IQ pillar pages: https://moolahiq.com/[pillar-name]
- Data citations inline
- Disclaimer: "This content is for educational purposes only and does not constitute financial advice."
- Concluding CTA to the newsletter

KEYWORD DENSITY RULE: The blog's primary keyword (derived from the topic) must appear
naturally throughout the post at a density of 1.5-2.5% (roughly once every 100-150
words). Weave it into the H1, at least 2 H2 headings, the introduction, topic
transitions, and the conclusion. Use the exact phrase — do NOT rephrase or synonym-swap
every occurrence. If the topic is "The Hidden Cost of Homeownership" the keyword phrase
is "hidden cost of homeownership" and it should appear 15-25 times in a 1,500-word post.
===BLOG_END===

===CHAPTERS_START===
(YouTube chapter markers in format "MM:SS Title")
00:00 Hook
...
===CHAPTERS_END===

VOICE RULES:
- Authoritative but approachable
- Data-backed claims with named sources
- Never condescending
- Never give specific investment advice
- Address the viewer as "you" frequently
- Target total script length: 2,000-2,800 words (160-200 sentences, 12-18 min at 155 WPM)
"""

QC_CORRECTION_PROMPT = """\

IMPORTANT -- CORRECTION ROUND #{correction_count}:
The previous version of this content FAILED quality checks. Fix these issues:

{qc_failures}

Focus your corrections on these specific failures. Keep everything else intact.
"""


class ContentAgent:
    """Produces script + blog via Claude Opus 4.6."""

    def __init__(self) -> None:
        self.name = "content"
        api_key = os.getenv("ANTHROPIC_API_KEY")
        self.llm = ChatAnthropic(
            model="claude-opus-4-6",
            api_key=api_key,
            temperature=0.7,
            max_tokens=8192,
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
        """Return realistic mock content for dry-run testing.

        On correction_count == 0 (first pass), returns content that will
        intentionally fail QC-06 (missing disclaimer) and QC-12 (only 2
        numbered steps), triggering one QC retry loop.  On correction_count >= 1,
        returns fully fixed content that passes all 57 checks.
        """
        topic = state.get("topic", "<none>")
        pillar = state.get("pillar", "EARN")
        correction_count = state.get("correction_count", 0)
        log.info("[%s] MOCK MODE -- generating content (correction=%d)", self.name, correction_count)

        # Shared body paragraphs to reach 1,300+ words
        body_paragraphs = (
            "You know that feeling when you check your bank account and wonder if "
            "you could survive an unexpected expense? You are not alone in this. "
            "According to the Federal Reserve, 22 percent of Americans have zero "
            "emergency savings. The Bureau of Labor Statistics reports the average "
            "unexpected expense is about 1,400 dollars. That means millions of you "
            "are one car repair, one medical bill, one job loss away from a debt spiral "
            "that could take years to recover from.\n\n"
            "But here is what most people get wrong about emergency funds. They think "
            "it is just about the money. It is not. It is about the psychological safety "
            "net that lets you make better financial decisions every single day. When you "
            "know you have three to six months of expenses saved, you negotiate harder at "
            "work, you walk away from unfavorable deals, and you sleep better at night. The data "
            "from the Bankrate survey confirms this. Their 2025 report found that people with adequate "
            "emergency savings report 40 percent lower financial stress scores.\n\n"
            "Let me break down exactly why this matters for you. The average American "
            "household faces between three and five financial emergencies per year. These "
            "range from minor car repairs averaging 500 to 600 dollars to major medical "
            "events costing thousands. Without a buffer, each one of these becomes a "
            "potential debt event. Credit card interest rates are averaging over 20 percent "
            "right now, according to the Federal Reserve data. That means a single 2,000 "
            "dollar emergency financed on credit cards costs you an extra 400 dollars "
            "or more in interest if you take a year to pay it off.\n\n"
            "The research is clear on this. A study published by the National Bureau of "
            "Economic Research found that households with even 500 dollars in liquid savings "
            "were significantly less likely to experience financial hardship after an income "
            "disruption. You do not need a massive fortune to start. You just need a system "
            "that works for your life, your income, and your goals.\n\n"
            "Think about your own situation for a moment. How would you handle a 1,400 "
            "dollar surprise expense today? Would you pay it from savings, put it on a "
            "credit card, borrow from family, or skip another bill? Your answer to that "
            "question tells you exactly where you stand. And if the answer is anything "
            "other than savings, you are in the right place today.\n\n"
            "The good news is that building an emergency fund is one of the most "
            "straightforward financial moves you can make. It does not require complex "
            "investing knowledge. It does not require a high income. It requires a plan, "
            "consistency, and the right account structure. That is exactly what we are "
            "going to cover in the solution section of this video."
        )

        if correction_count == 0:
            # FIRST PASS: missing disclaimer + only 2 steps -> triggers QC retry
            script = (
                "[HOOK]\n"
                "What if I told you that one simple change could save you from financial disaster? "
                "Most people learn this lesson the hard way but you do not have to.\n\n"
                "[INTRO]\n"
                "Welcome to MOOLAH IQ — where we make personal finance, investing, and trading simple. "
                + body_paragraphs + "\n\n"
                "[MAIN]\n"
                "Let me tell you about a family who thought they were doing everything right. "
                "They had good jobs, a nice home, and what they thought was solid insurance. "
                "Then a pipe burst in their basement. The repair bill was 47,000 dollars. "
                "Their insurance excluded internal plumbing failures, buried on page 34 of the policy. "
                "Their emergency fund was gone in a single week. "
                "The emotional toll was devastating. Security turned to devastation, then anger. "
                "But from that anger came education, and from education came a principle "
                "that changed how they managed money forever.\n\n"
                "Here is the principle. The Gap Principle says you have no coverage until you "
                "verify every exclusion. But it applies beyond insurance. Every financial "
                "safety net has gaps you need to find before disaster strikes.\n\n"
                "Here is how to protect yourself.\n"
                "1. Audit your current safety nets. Check insurance exclusions, emergency fund size, and debt exposure.\n"
                "2. Build a 3 month emergency runway. Start with 1,000 dollars, then automate 200 dollars per month until you hit 3 months of expenses.\n\n"
                "[CTA]\n"
                "If you found this helpful, subscribe and hit the bell so you never miss a "
                "Moolah IQ video. Drop a comment below. What is the biggest gap in your "
                "financial safety net? "
                "This is MOOLAH IQ — helping you increase your financial IQ, one wise decision at a time. "
                f"Check out the full breakdown on our blog at moolahiq.com/{pillar.lower()}.\n"
            )
        else:
            # CORRECTED PASS: adds disclaimer + 3 numbered steps -> passes all QC
            script = (
                "[HOOK]\n"
                "What if I told you that one simple change could save you from financial disaster? "
                "Now I am not a financial advisor and this is not financial advice, but "
                "most people learn this lesson the hard way and you do not have to.\n\n"
                "[INTRO]\n"
                "Welcome to MOOLAH IQ — where we make personal finance, investing, and trading simple. "
                + body_paragraphs + "\n\n"
                "[MAIN]\n"
                "Let me tell you about a family who thought they were doing everything right. "
                "They had good jobs, a nice home, and what they thought was solid insurance. "
                "Then a pipe burst in their basement. The repair bill was 47,000 dollars. "
                "Their insurance excluded internal plumbing failures, buried on page 34 of the policy. "
                "Their emergency fund was gone in a single week. "
                "The emotional toll was devastating. Security turned to devastation, then anger. "
                "But from that anger came education, and from education came a principle "
                "that changed how they managed money forever.\n\n"
                "Here is the principle. The Gap Principle says you have no coverage until you "
                "verify every exclusion. But it applies beyond insurance. Every financial "
                "safety net has gaps you need to find before disaster strikes.\n\n"
                "Let me pause here. Think about your own finances for a moment. Where is your gap?\n\n"
                "Here is how to protect yourself.\n"
                "1. Audit your current safety nets. Check insurance exclusions, emergency fund size, "
                "and debt exposure. Call your insurance agent this week and ask for a full exclusion walkthrough. "
                "Review your deductibles and make sure you can actually afford them if a claim hits.\n"
                "2. Build a 3 month emergency runway. Start with 1,000 dollars, then automate 200 dollars "
                "per month until you hit 3 months of expenses. Use a high-yield savings account earning "
                "4 to 5 percent APY. Bankrate tracks the best rates weekly so you can comparison shop.\n"
                "3. Create a financial fire drill. Once per quarter, simulate a 2,000 dollar emergency. "
                "Can you cover it without credit cards? If not, that is your gap to close. Track your "
                "progress monthly and adjust your contribution amount as your income changes.\n\n"
                "This content is for educational purposes only and does not constitute financial advice. "
                "Consult a financial professional before making major money decisions.\n\n"
                "[CTA]\n"
                "If you found this helpful, subscribe and hit the bell so you never miss a "
                "Moolah IQ video. Drop a comment below. What is the biggest gap in your "
                "financial safety net? "
                "This is MOOLAH IQ — helping you increase your financial IQ, one wise decision at a time. "
                f"Check out the full breakdown on our blog at moolahiq.com/{pillar.lower()}.\n"
            )

        blog = f"""# {topic}: The Complete Guide to Financial Security

## Why {topic} Matters More Than You Think

According to a Federal Reserve study, 22 percent of Americans have no emergency savings at all.
The Bankrate 2025 Survey found the median emergency fund balance is just 4,800 dollars, barely
enough to cover three months of basic expenses in most cities.

If you are reading this, you already know something needs to change. Let us fix that today.

## The Story That Changed Everything

A homeowner discovered, after a catastrophic pipe burst, that their insurance policy
excluded water damage from internal plumbing failures. The 47,000 dollar repair bill wiped out
their emergency fund. The Bureau of Labor Statistics data shows this type of event is far more
common than most people realize. Read the full story in our video above.

## The Gap Principle

No coverage until you verify exclusions. This principle applies to your entire financial
life, from insurance policies to investment portfolios to estate plans. The Federal Reserve
research confirms that most households significantly overestimate their coverage levels.

## 3 Steps to Close Your Financial Gaps

### Step 1: Audit Your Safety Nets
Review every insurance policy, check your emergency fund target, and assess your debt exposure.
According to the National Bureau of Economic Research, even 500 dollars in liquid savings
can significantly reduce financial hardship after an income disruption.

### Step 2: Build Your Emergency Runway
Start with 1,000 dollars, then automate monthly contributions. A high-yield savings account at
4 to 5 percent APY keeps your money working while remaining accessible. Bankrate tracks the best
rates weekly. Your target should be 3 to 6 months of essential expenses.

### Step 3: Run Financial Fire Drills
Once per quarter, simulate a 2,000 dollar emergency. Can you handle it without credit cards?
If not, that is your gap to close. This exercise builds financial confidence and reveals weak spots
before real emergencies expose them.

## Related Resources

Learn more about protecting your finances at [https://moolahiq.com/protect](https://moolahiq.com/protect).
Build smarter savings habits at [https://moolahiq.com/save](https://moolahiq.com/save).
Explore our investment guides at [https://moolahiq.com/invest](https://moolahiq.com/invest).
Check out milestone planning at [https://moolahiq.com/milestones](https://moolahiq.com/milestones).

## Final Thoughts

Building an emergency fund is not glamorous, but it is the foundation everything else sits on.
Without it, every other financial goal, investing, buying a home, retiring early, is built on sand.

This content is for educational purposes only and does not constitute financial advice.
Always consult a financial professional before making major money decisions.

Ready to take control? Subscribe to the Moolah IQ newsletter for weekly smart money moves.
"""
        state["script"] = script
        state["blog"] = blog
        state.setdefault("metadata", {})["chapter_markers"] = (
            "00:00 Hook\n00:15 The Problem\n01:15 The Story\n02:45 The Principle\n"
            "03:15 The Solution\n05:15 Call to Action"
        )
        log.info("[%s] MOCK content generated -- script=%d words, blog=%d words",
                 self.name, len(script.split()), len(blog.split()))
        return state

    def run(self, state: PipelineState) -> PipelineState:
        """Generate script and blog post."""
        if state.get("mock_mode"):
            return self._mock_run(state)

        topic = state.get("topic", "<none>")
        pillar = state.get("pillar", "EARN")
        correction_count = state.get("correction_count", 0)
        metadata = state.get("metadata", {})
        research = metadata.get("research", {})
        decision = metadata.get("decision", {})
        war_story = research.get("war_story_match", {})

        log.info("[%s] Generating content for '%s' (correction=%d)",
                 self.name, topic, correction_count)

        # -- Build the user prompt ---------------------------------------------
        user_prompt = f"TOPIC: {topic}\nPILLAR: {pillar}\n\n"

        # Research context
        user_prompt += "RESEARCH SUMMARY:\n"
        user_prompt += research.get("summary", "No research available.") + "\n\n"

        user_prompt += "KEY STATS:\n"
        for stat in research.get("key_stats", []):
            user_prompt += f"- {stat.get('stat', '')}: {stat.get('value', '')} "
            user_prompt += f"(source: {stat.get('source', 'N/A')})\n"

        user_prompt += f"\nSUGGESTED ANGLE: {decision.get('angle', topic)}\n"
        user_prompt += f"TARGET LENGTH: {decision.get('target_length_minutes', 10)} minutes\n\n"

        # War story
        if war_story:
            user_prompt += "WAR STORY TO WEAVE IN:\n"
            user_prompt += f"  Title: {war_story.get('title', '')}\n"
            user_prompt += f"  Summary: {war_story.get('summary', '')}\n"
            user_prompt += f"  Principle: {war_story.get('principle', '')}\n"
            user_prompt += f"  Emotional Arc: {war_story.get('emotional_arc', '')}\n"
            user_prompt += f"  Lesson: {war_story.get('lesson', '')}\n\n"

        # Pain points
        pain_points = research.get("audience_pain_points", [])
        if pain_points:
            user_prompt += "AUDIENCE PAIN POINTS TO ADDRESS:\n"
            for pp in pain_points:
                user_prompt += f"- {pp}\n"
            user_prompt += "\n"

        # QC correction feedback (on retry loops)
        if correction_count > 0:
            qc_results = state.get("qc_results", [])
            failures = [r for r in qc_results if not r.get("passed")]
            if failures:
                failure_text = "\n".join(
                    f"- [{r.get('check_id', '?')}] {r.get('name', '?')}: {r.get('details', '')}"
                    for r in failures
                )
                user_prompt += QC_CORRECTION_PROMPT.format(
                    correction_count=correction_count,
                    qc_failures=failure_text,
                )

                # Include previous content for reference
                prev_script = state.get("script", "")
                if prev_script and not prev_script.startswith("[STUB]"):
                    user_prompt += f"\nPREVIOUS SCRIPT (fix the issues above):\n{prev_script}\n"

        # -- Call Claude -------------------------------------------------------
        try:
            raw = self._call_llm([
                SystemMessage(content=SYSTEM_PROMPT),
                HumanMessage(content=user_prompt),
            ])

            script = self._extract_section(raw, "===SCRIPT_START===", "===SCRIPT_END===")
            blog = self._extract_section(raw, "===BLOG_START===", "===BLOG_END===")
            chapters = self._extract_section(raw, "===CHAPTERS_START===", "===CHAPTERS_END===")

            # Fallback: if markers weren't used, treat the whole response as content
            if not script and not blog:
                log.warning("[%s] Section markers not found -- using raw response", self.name)
                midpoint = len(raw) // 2
                script = raw[:midpoint]
                blog = raw[midpoint:]
                chapters = ""

            state["script"] = script
            state["blog"] = blog
            state.setdefault("metadata", {})["chapter_markers"] = chapters

            word_count = len(script.split())
            log.info("[%s] Content generated -- script=%d words, blog=%d words",
                     self.name, word_count, len(blog.split()))

        except Exception as exc:
            log.error("[%s] Content generation failed: %s", self.name, exc)
            state["script"] = f"[ERROR] Content generation failed: {exc}"
            state["blog"] = f"[ERROR] Content generation failed: {exc}"

        return state
