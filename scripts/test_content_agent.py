#!/usr/bin/env python3
"""Live single-agent test for ContentAgent with real API keys."""

import json
import sys
import time
from pathlib import Path

# ── project root on sys.path ──────────────────────────────────────────
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from dotenv import load_dotenv
load_dotenv(ROOT / ".env")

from src.agents.content import ContentAgent
from src.state import PipelineState

# ── mock research data (simulates ResearchAgent output) ───────────────
MOCK_RESEARCH = {
    "summary": (
        "Homeownership is often marketed as the ultimate financial milestone, "
        "but the true cost extends far beyond the mortgage payment. Americans "
        "spend an average of $18,000/year on hidden costs including property "
        "taxes, insurance, maintenance, and repairs. A 2024 Bankrate survey "
        "found that 58% of homeowners experienced 'sticker shock' from "
        "unexpected expenses in their first two years."
    ),
    "key_stats": [
        {"stat": "Average annual hidden costs", "value": "$18,118", "source": "Bankrate 2024"},
        {"stat": "Homeowners with emergency fund for repairs", "value": "38%", "source": "Freddie Mac"},
        {"stat": "Average roof replacement cost", "value": "$9,117", "source": "HomeAdvisor 2024"},
        {"stat": "Annual maintenance rule of thumb", "value": "1-2% of home value", "source": "NAHB"},
    ],
    "sources": [
        "Bankrate 2024 Hidden Costs of Homeownership Survey",
        "Freddie Mac Housing Survey Q3 2024",
        "National Association of Home Builders (NAHB)",
        "HomeAdvisor True Cost Guide 2024",
    ],
    "audience_pain_points": [
        "Surprised by property tax increases after purchase",
        "No budget for major repairs (HVAC, roof, plumbing)",
        "HOA fees and special assessments catch them off guard",
        "Insurance premiums rising 10-20% annually in some states",
        "Opportunity cost of down payment vs. investing",
    ],
    "competitor_gaps": [
        "Most content focuses on mortgage rates, ignores ongoing costs",
        "Few creators provide an actionable maintenance budget template",
        "No one connects homeownership costs back to overall financial plan",
    ],
    "suggested_angle": (
        "Frame homeownership as a financial system with ongoing operating "
        "costs, not a one-time purchase. Provide a concrete annual budget "
        "template homeowners can use immediately."
    ),
    "search_volume_estimate": "high",
    "war_story_match": {
        "id": "ws-007",
        "title": "The $47,000 First Year",
        "summary": (
            "A couple bought their dream home only to face a failed HVAC system, "
            "termite damage, and a property tax reassessment — all in year one."
        ),
        "principle": "Budget for the house you own, not just the house you bought.",
        "emotional_arc": "excitement → shock → adaptation → mastery",
        "lesson": (
            "Every home needs a 'home emergency fund' equal to 1-3% of its value, "
            "separate from your regular emergency fund."
        ),
        "pillars": ["SPEND", "SAVE", "PROTECT"],
        "tags": ["homeownership", "emergency-fund", "budgeting", "insurance"],
    },
}

# ── build minimal state ───────────────────────────────────────────────
state: PipelineState = {
    "topic": "The Hidden Cost of Homeownership",
    "pillar": "SPEND",
    "mock_mode": False,
    "correction_count": 0,
    "metadata": {"research": MOCK_RESEARCH},
}

# ── run ───────────────────────────────────────────────────────────────
print("=" * 70)
print("CONTENT AGENT — LIVE TEST")
print(f"Topic : {state['topic']}")
print(f"Pillar: {state['pillar']}")
print(f"Mock  : {state['mock_mode']}")
print("=" * 70)

agent = ContentAgent()
if not agent.llm:
    print("\nERROR: ANTHROPIC_API_KEY not found. Cannot run live test.")
    sys.exit(1)

print("\nCalling ContentAgent.run() …  (this may take 30-90 seconds)\n")
t0 = time.time()
state = agent.run(state)
elapsed = time.time() - t0

# ── display results ───────────────────────────────────────────────────
script = state.get("script", "")
blog = state.get("blog", "")
chapters = state.get("metadata", {}).get("chapter_markers", "")

print("=" * 70)
print("SCRIPT")
print("=" * 70)
print(script[:3000] if len(script) > 3000 else script)
if len(script) > 3000:
    print(f"\n… [{len(script) - 3000} more chars truncated]")

print("\n" + "=" * 70)
print("BLOG POST")
print("=" * 70)
print(blog[:3000] if len(blog) > 3000 else blog)
if len(blog) > 3000:
    print(f"\n… [{len(blog) - 3000} more chars truncated]")

if chapters:
    print("\n" + "=" * 70)
    print("CHAPTER MARKERS")
    print("=" * 70)
    print(chapters)

print("\n" + "=" * 70)
print(f"Done in {elapsed:.1f}s")
print(f"Script length : {len(script):,} chars")
print(f"Blog length   : {len(blog):,} chars")
print("=" * 70)

# ── save to JSON ──────────────────────────────────────────────────────
out_path = ROOT / "tests" / "results" / "content_agent_live_test.json"
out_path.parent.mkdir(parents=True, exist_ok=True)
out_path.write_text(
    json.dumps(
        {
            "topic": state["topic"],
            "pillar": state["pillar"],
            "mock_mode": state["mock_mode"],
            "elapsed_seconds": round(elapsed, 1),
            "script": script,
            "script_length": len(script),
            "blog": blog,
            "blog_length": len(blog),
            "chapter_markers": chapters,
        },
        indent=2,
        ensure_ascii=False,
    ),
    encoding="utf-8",
)
print(f"\nResults saved -> {out_path}")
