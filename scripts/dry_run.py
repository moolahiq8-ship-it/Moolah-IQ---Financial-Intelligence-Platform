#!/usr/bin/env python3
"""Dry-run the full Moolah IQ pipeline with mock data, or run live with real APIs.

Runs all 11 agents end-to-end. Default mode uses mock_mode=True so no external
API calls are made. Use --live to run with real API keys. Production and
publishing agents are fully wired and will attempt real calls to ComfyUI,
Qwen3-TTS, Postiz, and Beehiiv — gracefully skipping any unreachable services.

Usage:
    python scripts/dry_run.py
    python scripts/dry_run.py --topic "High-Yield Savings 2026" --pillar SAVE
    python scripts/dry_run.py --live --topic "The Hidden Cost of Homeownership" --pillar SPEND
    python scripts/dry_run.py --log-level DEBUG
"""

from __future__ import annotations

import argparse
import json
import logging
import sys
import time
from pathlib import Path

# Ensure project root is on path
sys.path.insert(0, ".")

from dotenv import load_dotenv  # noqa: E402

load_dotenv()

from src.orchestrator import run  # noqa: E402


def print_section(title: str) -> None:
    print(f"\n{'-' * 60}")
    print(f"  {title}")
    print(f"{'-' * 60}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Moolah IQ V3.8.2 -- Pipeline Dry Run / Live Run",
    )
    parser.add_argument(
        "--topic",
        default="Emergency Fund Basics",
        help="Video topic (default: 'Emergency Fund Basics')",
    )
    parser.add_argument(
        "--pillar",
        default="SAVE",
        help="Content pillar (default: SAVE)",
    )
    parser.add_argument(
        "--live",
        action="store_true",
        default=False,
        help="Run with real API keys (mock_mode=False). "
             "Unreachable services are gracefully skipped.",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Logging verbosity (default: INFO)",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s | %(name)-28s | %(levelname)-7s | %(message)s",
        datefmt="%H:%M:%S",
    )

    mock_mode = not args.live

    mode_label = "LIVE (real APIs, graceful degradation)" if args.live else "MOCK (no API calls)"
    print("=" * 60)
    print(f"  MOOLAH IQ V3.8.2 -- {'LIVE RUN' if args.live else 'DRY RUN'}")
    print("=" * 60)
    print(f"  Topic:  {args.topic}")
    print(f"  Pillar: {args.pillar}")
    print(f"  Mode:   {mode_label}")
    print("=" * 60)

    start = time.time()
    final_state = run(args.topic, args.pillar, mock_mode=mock_mode)
    elapsed = time.time() - start

    # ── Results ──────────────────────────────────────────────────
    print_section("PIPELINE RESULT")
    print(f"  Topic:        {final_state.get('topic')}")
    print(f"  Pillar:       {final_state.get('pillar')}")
    print(f"  Mock Mode:    {final_state.get('mock_mode')}")
    print(f"  Corrections:  {final_state.get('correction_count', 0)}")
    print(f"  Elapsed:      {elapsed:.2f}s")

    # Compliance
    compliance = final_state.get("compliance_result", {})
    status = "APPROVED" if compliance.get("approved") else "BLOCKED"
    print(f"  Compliance:   {status}")
    if compliance.get("flags"):
        for flag in compliance["flags"]:
            print(f"    ! {flag}")

    # Research summary (live mode)
    if args.live:
        research = final_state.get("metadata", {}).get("research", {})
        if research:
            print_section("RESEARCH AGENT")
            summary = research.get("summary", "")
            print(f"  {summary[:300]}..." if len(summary) > 300 else f"  {summary}")
            stats = research.get("key_stats", [])
            if stats:
                print(f"\n  Key stats ({len(stats)}):")
                for s in stats[:5]:
                    print(f"    - {s.get('stat', '?')}: {s.get('value', '?')} ({s.get('source', '?')})")
            print(f"  Pain points:  {len(research.get('audience_pain_points', []))}")
            print(f"  Comp gaps:    {len(research.get('competitor_gaps', []))}")
            print(f"  Search vol:   {research.get('search_volume_estimate', '?')}")
            ws = research.get("war_story_match", {})
            if ws:
                print(f"  War story:    {ws.get('title', '?')}")

    # Decision summary (live mode)
    if args.live:
        decision = final_state.get("metadata", {}).get("decision", {})
        if decision:
            print_section("DECISION AGENT")
            verdict = "GO" if decision.get("approved") else "NO-GO"
            print(f"  Verdict:      {verdict}")
            print(f"  Composite:    {decision.get('composite_score', '?')}/100")
            print(f"  Alignment:    {decision.get('alignment_score', '?')}/100")
            print(f"  Demand:       {decision.get('demand_score', '?')}/100")
            print(f"  Gap:          {decision.get('gap_score', '?')}/100")
            print(f"  Confidence:   {decision.get('confidence_score', '?')}/100")
            print(f"  Angle:        {decision.get('angle', '?')}")
            reasoning = decision.get("reasoning", "")
            print(f"  Reasoning:    {reasoning[:200]}..." if len(reasoning) > 200 else f"  Reasoning:    {reasoning}")

    # Publishing
    publish = final_state.get("publish_status", {})
    if publish:
        print_section("PUBLISH STATUS")
        for platform, pstatus in publish.items():
            print(f"  {platform:>12s}: {pstatus}")

    # QC Summary
    qc_results = final_state.get("qc_results", [])
    if qc_results:
        passed = sum(1 for r in qc_results if r.get("passed"))
        failed = len(qc_results) - passed
        print_section(f"QC RESULTS ({passed} passed, {failed} failed, {len(qc_results)} total)")
        for r in qc_results:
            icon = "PASS" if r.get("passed") else "FAIL"
            print(f"  [{icon}] {r.get('check_id', '?'):6s} {r.get('name', '?')}")
            if not r.get("passed"):
                print(f"         -> {r.get('reason', '')}")

    # Analytics
    analytics = final_state.get("metadata", {}).get("analytics", {})
    if analytics:
        label = "ANALYTICS" + (" (mock -- no real video)" if args.live else " (mock data)")
        print_section(label)
        yt = analytics.get("youtube", {})
        print(f"  YouTube:    {yt.get('views_48h', 0):,} views, {yt.get('likes', 0)} likes, "
              f"CTR {yt.get('ctr', 0):.1%}")
        nl = analytics.get("newsletter", {})
        print(f"  Newsletter: {nl.get('open_rate', 0):.0%} open, {nl.get('click_rate', 0):.0%} click")
        soc = analytics.get("social", {})
        print(f"  Social:     {soc.get('total_impressions', 0):,} impressions, "
              f"{soc.get('engagement_rate', 0):.1%} engagement")
        blog_a = analytics.get("blog", {})
        print(f"  Blog:       {blog_a.get('page_views', 0):,} views, "
              f"{blog_a.get('avg_time_on_page_seconds', 0)}s avg time")

    # Optimization
    opt = final_state.get("metadata", {}).get("optimization", {})
    if opt:
        print_section(f"OPTIMIZATION (score: {opt.get('overall_score', '?')}/10)")
        print(f"  {opt.get('summary', '')}")
        recs = opt.get("topic_recommendations", [])
        if recs:
            print(f"\n  Next topic suggestions:")
            for r in recs:
                print(f"    - [{r.get('pillar', '?')}] {r.get('topic', '?')}")

    # Failure memory
    fm = final_state.get("failure_memory", [])
    if fm:
        print_section(f"FAILURE MEMORY ({len(fm)} entries)")
        for entry in fm:
            print(f"  - {entry.get('pattern', '?')}: {entry.get('fix', '?')}")

    # Content artifacts summary
    script = final_state.get("script", "")
    blog = final_state.get("blog", "")
    newsletter = final_state.get("newsletter", "")
    print_section("CONTENT ARTIFACTS")
    print(f"  Script:     {len(script.split())} words / {len(script):,} chars")
    print(f"  Blog:       {len(blog.split())} words / {len(blog):,} chars")
    print(f"  Newsletter: {len(newsletter.split())} words / {len(newsletter):,} chars")

    # SEO
    metadata = final_state.get("metadata", {})
    print_section("SEO METADATA")
    print(f"  YT Title A: {metadata.get('youtube_title_a', 'N/A')}")
    print(f"  YT Title B: {metadata.get('youtube_title_b', 'N/A')}")
    print(f"  Tags:       {len(metadata.get('youtube_tags', []))}")
    print(f"  Keyword:    {metadata.get('primary_keyword', 'N/A')}")
    sec_kw = metadata.get("secondary_keywords", [])
    if sec_kw:
        print(f"  Secondary:  {', '.join(sec_kw[:5])}")
    print(f"  Blog title: {metadata.get('blog_meta_title', 'N/A')}")
    print(f"  Meta desc:  {metadata.get('blog_meta_description', 'N/A')}")

    # Final verdict
    print("\n" + "=" * 60)
    run_type = "LIVE RUN" if args.live else "DRY RUN"
    if status == "APPROVED" and all(v != "failed" for v in publish.values()):
        print(f"  {run_type}: PASSED -- pipeline completed successfully")
    else:
        print(f"  {run_type}: ISSUES DETECTED -- see details above")
    print(f"  Total time: {elapsed:.2f}s")
    print("=" * 60)

    # ── Save full results to JSON (live runs only) ────────────────
    if args.live:
        out_dir = Path("tests/results")
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "live_pipeline_run.json"
        out_path.write_text(
            json.dumps(
                {
                    "topic": final_state.get("topic"),
                    "pillar": final_state.get("pillar"),
                    "mock_mode": False,
                    "elapsed_seconds": round(elapsed, 1),
                    "corrections": final_state.get("correction_count", 0),
                    "compliance": compliance,
                    "publish_status": publish,
                    "qc_passed": passed if qc_results else 0,
                    "qc_failed": failed if qc_results else 0,
                    "research": final_state.get("metadata", {}).get("research", {}),
                    "decision": final_state.get("metadata", {}).get("decision", {}),
                    "script": script,
                    "script_words": len(script.split()),
                    "blog": blog,
                    "blog_words": len(blog.split()),
                    "newsletter": newsletter,
                    "newsletter_words": len(newsletter.split()),
                    "seo": {
                        "youtube_title_a": metadata.get("youtube_title_a"),
                        "youtube_title_b": metadata.get("youtube_title_b"),
                        "youtube_tags_count": len(metadata.get("youtube_tags", [])),
                        "primary_keyword": metadata.get("primary_keyword"),
                        "secondary_keywords": metadata.get("secondary_keywords", []),
                        "blog_meta_title": metadata.get("blog_meta_title"),
                        "blog_meta_description": metadata.get("blog_meta_description"),
                    },
                    "analytics": analytics,
                    "optimization": opt,
                    "failure_memory": fm,
                },
                indent=2,
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
        print(f"\n  Results saved -> {out_path}")


if __name__ == "__main__":
    main()
