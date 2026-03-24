"""Pipeline state schema for the Moolah IQ V3.8.3.3 LangGraph orchestrator."""

from __future__ import annotations

from typing import Annotated, Any, TypedDict


# ── Reducers for parallel-safe state merging ──────────────────────────
# When parallel nodes (newsletter + production) run concurrently and both
# return the full state dict, LangGraph needs reducers to merge the writes.


def _last(a: Any, b: Any) -> Any:
    """Last-writer-wins, preferring truthy values for parallel-safe merging.

    When parallel nodes (newsletter + production) both return the full state,
    the node that *didn't* set a field passes through the channel default
    (e.g. "" for str, 0 for int).  This reducer keeps the truthy value so
    an empty pass-through never overwrites real content.
    """
    return b if b else a


def _merge_dict(a: dict | None, b: dict | None) -> dict:
    """Shallow merge for dict values — both parallel branches contribute keys."""
    if a is None and b is None:
        return {}
    if a is None:
        return b or {}
    if b is None:
        return a
    return {**a, **b}


class QCResult(TypedDict, total=False):
    check_id: str
    name: str
    passed: bool
    details: str
    severity: str       # "blocking" | "warning" | "medium" | "high" | "critical"
    responsible_agent: str  # agent to route correction to


class ComplianceResult(TypedDict, total=False):
    approved: bool
    flags: list[str]
    reviewer: str
    timestamp: str


class PublishStatus(TypedDict, total=False):
    youtube: str        # "pending" | "scheduled" | "published" | "failed"
    blog: str
    newsletter: str
    social: str


class PipelineState(TypedDict, total=False):
    """Full state passed between agents in the LangGraph pipeline.

    Every agent's ``run(state)`` method receives and returns this dict.
    Fields are added progressively as the pipeline executes.

    All fields use Annotated reducers so that parallel fan-out nodes
    (newsletter + production) can safely write to overlapping keys.

    V3.8.3.3 STATE SCHEMA per directive Section 9.1:
    {topic, pillar, script, blog, visuals, audio, metadata, qc_results,
     compliance_result, publish_status, correction_count, failure_memory,
     improvement_cycle_status, ab_test_config, prompt_version}
    """

    # ── Topic & Planning ─────────────────────────────────────────────
    topic: Annotated[str, _last]
    pillar: Annotated[str, _last]  # one of the 8 Moolah IQ pillars

    # ── Content Artifacts ────────────────────────────────────────────
    script: Annotated[str, _last]
    blog: Annotated[str, _last]
    newsletter: Annotated[str, _last]

    # ── Production Artifacts ─────────────────────────────────────────
    visuals: Annotated[dict[str, Any], _merge_dict]   # paths / metadata for generated visuals
    audio: Annotated[dict[str, Any], _merge_dict]      # TTS output, music bed, final mix
    video_path: Annotated[str, _last]                  # path to final assembled MP4 video
    youtube_id: Annotated[str, _last]                  # YouTube video ID after upload

    # ── Metadata & SEO ───────────────────────────────────────────────
    metadata: Annotated[dict[str, Any], _merge_dict]  # title, description, tags, thumbnails

    # ── Quality & Compliance ─────────────────────────────────────────
    qc_results: Annotated[list[QCResult], _last]
    compliance_result: Annotated[ComplianceResult, _last]

    # ── Publishing ───────────────────────────────────────────────────
    publish_status: Annotated[PublishStatus, _last]

    # ── Feedback Loop ────────────────────────────────────────────────
    correction_count: Annotated[int, _last]
    failure_memory: Annotated[list[dict[str, Any]], _last]  # rolling 10-video window

    # ── Self-Improvement (V3.8.3.3) ──────────────────────────────────
    improvement_cycle_status: Annotated[dict[str, Any], _merge_dict]  # harvest/synthesize/evolve/test
    ab_test_config: Annotated[dict[str, Any], _merge_dict]            # current A/B test configuration
    prompt_version: Annotated[dict[str, str], _merge_dict]            # agent_name -> prompt version ID

    # ── HITL Gate Approvals ──────────────────────────────────────────
    hitl_approvals: Annotated[dict[str, Any], _merge_dict]  # gate_name -> {approved, timestamp, notes}

    # ── Pipeline Control ──────────────────────────────────────────────
    mock_mode: Annotated[bool, _last]  # When True, agents return stub data instead of calling APIs
    skip_platforms: Annotated[list[str], _last]  # Platforms to skip (e.g. ["tiktok", "newsletter"])
