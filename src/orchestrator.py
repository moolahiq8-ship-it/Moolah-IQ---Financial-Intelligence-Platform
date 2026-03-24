"""LangGraph state-machine orchestrator for the Moolah IQ V3.8.3.3 pipeline.

Wires 16 agents into a directed graph with conditional edges,
a QC retry loop (max 3 corrections), compliance gate with
absolute block authority, VRAM Guard, parallel Production branching,
and weekly Self-Improvement cycle (Harvest → Synthesize → Evolve → A/B Test).

Usage:
    python -m src.orchestrator "Emergency Fund Basics" --pillar SAVE
"""

from __future__ import annotations

import argparse
import logging
import os
import subprocess
import time

from dotenv import load_dotenv
from langgraph.graph import END, START, StateGraph

from src.agents.analytics import AnalyticsAgent
from src.agents.compliance import ComplianceAgent
from src.agents.content import ContentAgent
from src.agents.decision import DecisionAgent
from src.agents.newsletter import NewsletterAgent
from src.agents.optimization import OptimizationAgent
from src.agents.production import ProductionAgent
from src.agents.publishing import PublishingAgent
from src.agents.qc import QCAgent
from src.agents.research import ResearchAgent
from src.agents.seo import SEOAgent
from src.agents.performance_harvester import PerformanceHarvesterAgent
from src.agents.insight_synthesizer import InsightSynthesizerAgent
from src.agents.prompt_evolver import PromptEvolverAgent
from src.agents.ab_test_orchestrator import ABTestOrchestratorAgent
from src.hitl import (
    auto_approve,
    format_script_approval,
    format_title_approval,
    send_approval_request,
    wait_for_approval,
)
from src.state import PipelineState

# -- Environment ---------------------------------------------------------------

load_dotenv()

# LangSmith tracing only activates when explicitly opted-in via LANGSMITH_TRACING=true.
if os.getenv("LANGSMITH_API_KEY") and os.getenv("LANGSMITH_TRACING", "").lower() == "true":
    os.environ.setdefault("LANGSMITH_PROJECT", "moolah-iq-pipeline")

log = logging.getLogger(__name__)

MAX_CORRECTIONS = 3
VALID_PILLARS = frozenset(
    {"EARN", "SPEND", "SAVE", "INVEST", "PROTECT", "OPTIMIZE", "MILESTONES", "LEGACY"}
)

# -- Agent singletons ----------------------------------------------------------
# Instantiated once to avoid per-invocation init overhead.

_research = ResearchAgent()
_decision = DecisionAgent()
_content = ContentAgent()
_newsletter = NewsletterAgent()
_production = ProductionAgent()
_seo = SEOAgent()
_qc = QCAgent()
_compliance = ComplianceAgent()
_publishing = PublishingAgent()
_analytics = AnalyticsAgent()
_optimization = OptimizationAgent()
_harvester = PerformanceHarvesterAgent()
_synthesizer = InsightSynthesizerAgent()
_evolver = PromptEvolverAgent()
_ab_tester = ABTestOrchestratorAgent()


# -- VRAM Guard ----------------------------------------------------------------

def _vram_pre_clear() -> None:
    """Proactive VRAM Pre-Clear: issue 'ollama unload' before Production launch.

    V3.8.3.3: Issued 5 minutes before Production (while Content Agent is still
    generating). By the time Production starts, VRAM should already be clear.
    Hard Kill Timeout: force-kill at 5 seconds if VRAM doesn't drop below 4GB.
    """
    try:
        subprocess.run(["ollama", "stop", "--all"], capture_output=True, timeout=10)
        log.info("[vram_guard] Issued ollama stop --all")
        time.sleep(2)

        # Verify VRAM is below threshold (simplified check)
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=memory.used", "--format=csv,noheader,nounits"],
            capture_output=True, text=True, timeout=10,
        )
        if result.returncode == 0:
            vram_mb = int(result.stdout.strip().split("\n")[0])
            if vram_mb > 4096:
                log.warning("[vram_guard] VRAM still %dMB > 4096MB -- attempting hard kill", vram_mb)
                subprocess.run(["taskkill", "/F", "/IM", "ollama.exe"],
                               capture_output=True, timeout=5)
                time.sleep(2)
            else:
                log.info("[vram_guard] VRAM at %dMB -- clear for Production", vram_mb)
    except Exception as exc:
        log.warning("[vram_guard] VRAM check failed (non-fatal): %s", exc)


# -- Node functions -------------------------------------------------------------
# Each node receives the full PipelineState, delegates to its agent,
# and returns the (possibly mutated) state dict for LangGraph to merge.


def research_node(state: PipelineState) -> PipelineState:
    log.info("=== NODE: research ===")
    return _research.run(state)


def decision_node(state: PipelineState) -> PipelineState:
    log.info("=== NODE: decision ===")
    return _decision.run(state)


def content_node(state: PipelineState) -> PipelineState:
    """Run the content agent. On QC-triggered retries, bump correction_count."""
    log.info("=== NODE: content ===")
    failed_qc = [r for r in state.get("qc_results", []) if not r.get("passed")]
    if failed_qc:
        state["correction_count"] = state.get("correction_count", 0) + 1
        log.warning(
            "Content retry #%d -- %d QC failures to address",
            state["correction_count"],
            len(failed_qc),
        )
    return _content.run(state)


def newsletter_node(state: PipelineState) -> PipelineState:
    log.info("=== NODE: newsletter ===")
    return _newsletter.run(state)


def production_node(state: PipelineState) -> PipelineState:
    """Run Production Agent with VRAM pre-clear."""
    log.info("=== NODE: production (VRAM pre-clear) ===")
    if not state.get("mock_mode"):
        _vram_pre_clear()
    return _production.run(state)


def seo_node(state: PipelineState) -> PipelineState:
    log.info("=== NODE: seo ===")
    return _seo.run(state)


def qc_node(state: PipelineState) -> PipelineState:
    log.info("=== NODE: qc ===")
    return _qc.run(state)


def compliance_node(state: PipelineState) -> PipelineState:
    log.info("=== NODE: compliance ===")
    return _compliance.run(state)


def publishing_node(state: PipelineState) -> PipelineState:
    log.info("=== NODE: publishing ===")
    return _publishing.run(state)


def analytics_node(state: PipelineState) -> PipelineState:
    log.info("=== NODE: analytics ===")
    return _analytics.run(state)


def optimization_node(state: PipelineState) -> PipelineState:
    log.info("=== NODE: optimization ===")
    return _optimization.run(state)


# -- Self-Improvement Cycle nodes (V3.8.3.3) -----------------------------------

def harvester_node(state: PipelineState) -> PipelineState:
    log.info("=== NODE: performance_harvester ===")
    return _harvester.run(state)


def synthesizer_node(state: PipelineState) -> PipelineState:
    log.info("=== NODE: insight_synthesizer ===")
    return _synthesizer.run(state)


def evolver_node(state: PipelineState) -> PipelineState:
    log.info("=== NODE: prompt_evolver ===")
    return _evolver.run(state)


def ab_test_node(state: PipelineState) -> PipelineState:
    log.info("=== NODE: ab_test_orchestrator ===")
    return _ab_tester.run(state)


# -- HITL email pause gates ----------------------------------------------------

HITL_TIMEOUT_SECONDS = int(os.getenv("HITL_TIMEOUT_SECONDS", "3600"))


def title_approval_gate(state: PipelineState) -> PipelineState:
    """HITL Gate 1: Email the owner with the proposed topic/angle for approval.

    In mock_mode, auto-approves immediately.
    """
    log.info("=== HITL GATE 1: title_approval ===")

    subject, body_html, body_text = format_title_approval(state)

    token = send_approval_request(
        "title_approval", subject, body_html, body_text,
        metadata={"topic": state.get("topic"), "pillar": state.get("pillar")},
    )

    if state.get("mock_mode"):
        auto_approve(token, reason="mock_mode")

    result = wait_for_approval(token, timeout_seconds=5 if state.get("mock_mode") else HITL_TIMEOUT_SECONDS)

    approvals = state.get("hitl_approvals") or {}
    approvals["title_approval"] = result
    return {"hitl_approvals": approvals}


def script_approval_gate(state: PipelineState) -> PipelineState:
    """HITL Gate 2: Email the owner with the generated script for approval.

    In mock_mode, auto-approves immediately.
    """
    log.info("=== HITL GATE 2: script_approval ===")

    subject, body_html, body_text = format_script_approval(state)

    token = send_approval_request(
        "script_approval", subject, body_html, body_text,
        metadata={"topic": state.get("topic"), "word_count": len(state.get("script", "").split())},
    )

    if state.get("mock_mode"):
        auto_approve(token, reason="mock_mode")

    result = wait_for_approval(token, timeout_seconds=5 if state.get("mock_mode") else HITL_TIMEOUT_SECONDS)

    approvals = state.get("hitl_approvals") or {}
    approvals["script_approval"] = result
    return {"hitl_approvals": approvals}


def route_after_title_approval(state: PipelineState) -> str:
    """Route based on title approval: proceed to content or halt."""
    approvals = state.get("hitl_approvals", {})
    result = approvals.get("title_approval", {})
    status = result.get("status", "pending")

    if status == "approved":
        log.info("HITL Gate 1 APPROVED — proceeding to content")
        return "content"
    elif status == "timeout":
        log.warning("HITL Gate 1 TIMED OUT — halting pipeline")
        return END
    else:
        log.warning("HITL Gate 1 REJECTED — halting pipeline.  Notes: %s", result.get("notes"))
        return END


def route_after_script_approval(state: PipelineState) -> list[str]:
    """Route based on script approval: fan out to production+newsletter, or halt."""
    approvals = state.get("hitl_approvals", {})
    result = approvals.get("script_approval", {})
    status = result.get("status", "pending")

    if status == "approved":
        log.info("HITL Gate 2 APPROVED — fanning out to newsletter + production")
        return ["newsletter", "production"]
    elif status == "timeout":
        log.warning("HITL Gate 2 TIMED OUT — halting pipeline")
        return [END]
    else:
        log.warning("HITL Gate 2 REJECTED — halting pipeline.  Notes: %s", result.get("notes"))
        return [END]


# -- Conditional routing -------------------------------------------------------


def route_after_qc(state: PipelineState) -> str:
    """Decide whether to retry content or advance to compliance.

    Only *blocking* / *critical* / *high* severity failures trigger a retry loop.
    Warning-only failures are logged but do not block advancement.
    """
    failed = [r for r in state.get("qc_results", []) if not r.get("passed")]
    blocking = [r for r in failed if r.get("severity") in ("blocking", "critical", "high")]
    corrections = state.get("correction_count", 0)

    if not blocking:
        if failed:
            log.info(
                "QC: %d warning(s) but no blocking failures -- proceeding to compliance",
                len(failed),
            )
        else:
            log.info("QC PASSED -- all checks green, proceeding to compliance")
        return "compliance"

    if corrections >= MAX_CORRECTIONS:
        log.warning(
            "QC FAILED (%d blocking, %d total) but max corrections reached (%d/%d) "
            "-- forcing compliance review",
            len(blocking),
            len(failed),
            corrections,
            MAX_CORRECTIONS,
        )
        return "compliance"

    log.warning(
        "QC FAILED (%d blocking, %d total, correction %d/%d) -- routing back to content",
        len(blocking),
        len(failed),
        corrections + 1,
        MAX_CORRECTIONS,
    )
    return "content"


def route_after_compliance(state: PipelineState) -> str:
    """Publish if approved, halt the pipeline if blocked."""
    result = state.get("compliance_result", {})
    if result.get("approved"):
        log.info("COMPLIANCE APPROVED -- proceeding to publish")
        return "publishing"

    flags = result.get("flags", [])
    log.error("COMPLIANCE BLOCKED -- pipeline halted.  Flags: %s", flags)
    return END


# -- Graph construction --------------------------------------------------------


def build_graph() -> StateGraph:
    """Construct and compile the Moolah IQ V3.8.3.3 pipeline graph.

    Topology::

        START -> research -> decision -> [HITL Gate 1: title_approval]
              -> content -> [HITL Gate 2: script_approval]
              -+--> newsletter --+--> seo
               +--> production --+
              -> qc --+-> compliance --+-> publishing -> analytics
                      |                |     -> optimization
                      +-> content (retry, max 3)
                                       +-> END  (BLOCKED)
              -> optimization -> harvester -> synthesizer -> evolver
              -> ab_test -> END

    HITL Gates (email pause with approval polling):
        - Gate 1: After Decision — owner approves topic/angle via email
        - Gate 2: After Content — owner approves script/blog via email
        - Both auto-approve in mock_mode
        - Rejection or timeout → pipeline halts (END)

    V3.8.3.3 additions:
        - Parallel fan-out: content → [newsletter, production] → seo
        - VRAM pre-clear before production_node
        - Self-Improvement cycle after optimization
        - OPTIMIZE pillar replaces BORROW
    """
    graph = StateGraph(PipelineState)

    # -- Register all 16 agent nodes + 2 HITL gates ----------------------------
    graph.add_node("research", research_node)
    graph.add_node("decision", decision_node)
    graph.add_node("title_approval", title_approval_gate)      # HITL Gate 1
    graph.add_node("content", content_node)
    graph.add_node("script_approval", script_approval_gate)    # HITL Gate 2
    graph.add_node("newsletter", newsletter_node)
    graph.add_node("production", production_node)
    graph.add_node("seo", seo_node)
    graph.add_node("qc", qc_node)
    graph.add_node("compliance", compliance_node)
    graph.add_node("publishing", publishing_node)
    graph.add_node("analytics", analytics_node)
    graph.add_node("optimization", optimization_node)
    # Self-Improvement Cycle (V3.8.3.3)
    graph.add_node("harvester", harvester_node)
    graph.add_node("synthesizer", synthesizer_node)
    graph.add_node("evolver", evolver_node)
    graph.add_node("ab_test", ab_test_node)

    # -- Linear spine: research → decision → HITL Gate 1 → content ------------
    graph.add_edge(START, "research")
    graph.add_edge("research", "decision")
    graph.add_edge("decision", "title_approval")

    # Gate 1: title_approval → content (approved) or END (rejected/timeout)
    graph.add_conditional_edges(
        "title_approval",
        route_after_title_approval,
        {"content": "content", END: END},
    )

    # -- HITL Gate 2: content → script_approval → fan-out ----------------------
    graph.add_edge("content", "script_approval")

    # Gate 2: script_approval → [newsletter, production] (approved) or END.
    # route_after_script_approval returns a list for parallel fan-out.
    graph.add_conditional_edges(
        "script_approval",
        route_after_script_approval,
        {"newsletter": "newsletter", "production": "production", END: END},
    )
    graph.add_edge("newsletter", "seo")
    graph.add_edge("production", "seo")

    graph.add_edge("seo", "qc")

    # -- QC gate: retry loop or advance ----------------------------------------
    graph.add_conditional_edges(
        "qc",
        route_after_qc,
        {"content": "content", "compliance": "compliance"},
    )

    # -- Compliance gate: publish or halt --------------------------------------
    graph.add_conditional_edges(
        "compliance",
        route_after_compliance,
        {"publishing": "publishing", END: END},
    )

    # -- Post-publish spine + Self-Improvement Cycle ---------------------------
    graph.add_edge("publishing", "analytics")
    graph.add_edge("analytics", "optimization")
    graph.add_edge("optimization", "harvester")
    graph.add_edge("harvester", "synthesizer")
    graph.add_edge("synthesizer", "evolver")
    graph.add_edge("evolver", "ab_test")
    graph.add_edge("ab_test", END)

    return graph.compile()


# -- Public API ----------------------------------------------------------------

_compiled_graph = None


def get_graph():
    """Return the compiled graph, building it on first call."""
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph()
        log.info("Pipeline graph compiled -- %d nodes", len(_compiled_graph.nodes))
    return _compiled_graph


def run(
    topic: str,
    pillar: str = "EARN",
    mock_mode: bool = False,
    skip_platforms: list[str] | None = None,
) -> PipelineState:
    """Execute the full pipeline for a given topic.

    Args:
        topic:  The video topic (e.g. ``"Emergency Fund Basics"``).
        pillar: One of the 8 Moolah IQ pillars.
        mock_mode: If True, agents return realistic stub data instead of calling APIs.
        skip_platforms: Platform names to skip during publishing (e.g. ["tiktok", "newsletter"]).

    Returns:
        The final ``PipelineState`` after all nodes have executed
        (or after a compliance BLOCK halts the pipeline early).

    Raises:
        ValueError: If *pillar* is not one of the 8 valid pillars.
    """
    pillar = pillar.upper()
    if pillar not in VALID_PILLARS:
        raise ValueError(
            f"Invalid pillar '{pillar}'.  Must be one of: {sorted(VALID_PILLARS)}"
        )

    initial_state: PipelineState = {
        "topic": topic,
        "pillar": pillar,
        "correction_count": 0,
        "failure_memory": [],
        "mock_mode": mock_mode,
        "skip_platforms": skip_platforms or [],
        "improvement_cycle_status": {},
        "ab_test_config": {},
        "prompt_version": {},
        "hitl_approvals": {},
    }

    log.info(">> Starting pipeline -- topic='%s'  pillar='%s'  mock=%s  skip=%s",
             topic, pillar, mock_mode, skip_platforms or [])
    graph = get_graph()
    final_state: PipelineState = graph.invoke(initial_state)

    # -- Summary ---------------------------------------------------------------
    compliance = final_state.get("compliance_result", {})
    status = "APPROVED" if compliance.get("approved") else "BLOCKED"
    improvement = final_state.get("improvement_cycle_status", {})
    log.info(
        "<< Pipeline finished -- topic='%s'  compliance=%s  corrections=%d  improvement=%s",
        topic,
        status,
        final_state.get("correction_count", 0),
        improvement,
    )
    return final_state


# -- CLI -----------------------------------------------------------------------


def main() -> None:
    """Parse arguments and run the pipeline from the command line."""
    parser = argparse.ArgumentParser(
        description="Moolah IQ V3.8.3.3 -- YouTube Automation Pipeline",
    )
    parser.add_argument(
        "topic",
        help="Video topic  (e.g. 'Emergency Fund Basics')",
    )
    parser.add_argument(
        "--pillar",
        default="EARN",
        choices=sorted(VALID_PILLARS),
        help="Moolah IQ content pillar  (default: EARN)",
    )
    parser.add_argument(
        "--mock",
        action="store_true",
        default=False,
        help="Run in mock mode with realistic stub data (no API calls)",
    )
    parser.add_argument(
        "--skip",
        nargs="+",
        default=[],
        metavar="PLATFORM",
        help="Platforms to skip during publishing (e.g. --skip tiktok newsletter)",
    )
    parser.add_argument(
        "--log-level",
        default="INFO",
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Logging verbosity  (default: INFO)",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s | %(name)-28s | %(levelname)-7s | %(message)s",
        datefmt="%H:%M:%S",
    )

    final_state = run(args.topic, args.pillar, mock_mode=args.mock, skip_platforms=args.skip)

    # -- Print human-readable summary ------------------------------------------
    print("\n" + "=" * 60)
    print("  PIPELINE COMPLETE — V3.8.3.3")
    print("=" * 60)
    print(f"  Topic:        {final_state.get('topic')}")
    print(f"  Pillar:       {final_state.get('pillar')}")
    print(f"  Corrections:  {final_state.get('correction_count', 0)}")

    compliance = final_state.get("compliance_result", {})
    print(f"  Compliance:   {'APPROVED' if compliance.get('approved') else 'BLOCKED'}")

    if compliance.get("flags"):
        for flag in compliance["flags"]:
            print(f"    !  {flag}")

    publish = final_state.get("publish_status", {})
    if publish:
        for platform, status in publish.items():
            print(f"  Publish [{platform:>10s}]:  {status}")

    improvement = final_state.get("improvement_cycle_status", {})
    if improvement:
        print(f"  Self-Improve: {improvement}")

    print("=" * 60 + "\n")


if __name__ == "__main__":
    main()
