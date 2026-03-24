"""FastAPI server for the Moolah IQ pipeline.

Exposes a webhook-friendly API that n8n (or any HTTP client) can call
to trigger pipeline runs and poll for results.

Endpoints:
    GET  /topics/next   — pop the next pending topic from the queue
    POST /run           — start a pipeline run (returns immediately with run_id)
    GET  /status/{id}   — poll for status and results
    GET  /health        — liveness check
"""

from __future__ import annotations

import logging
import threading
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import yaml
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

load_dotenv()

TOPICS_QUEUE_PATH = Path(__file__).resolve().parent.parent / "data" / "topics_queue.yaml"

from src.orchestrator import run as run_pipeline  # noqa: E402

log = logging.getLogger(__name__)

app = FastAPI(
    title="Moolah IQ Pipeline API",
    version="3.8.2",
    description="Webhook endpoint for triggering the Moolah IQ content pipeline.",
)

# ── In-memory run store ───────────────────────────────────────────────
_runs: dict[str, dict[str, Any]] = {}
_lock = threading.Lock()

VALID_PILLARS = frozenset(
    {"EARN", "SAVE", "SPEND", "INVEST", "PROTECT", "BORROW", "LEGACY", "MILESTONES"}
)


# ── Request / response models ────────────────────────────────────────

class RunRequest(BaseModel):
    topic: str = Field(..., min_length=3, examples=["The Hidden Cost of Homeownership"])
    pillar: str = Field("EARN", examples=["SPEND"])
    mock_mode: bool = Field(False, description="If true, agents return stub data (no API calls)")


class RunResponse(BaseModel):
    run_id: str
    status: str
    topic: str
    pillar: str
    mock_mode: bool
    created_at: str


class StatusResponse(BaseModel):
    run_id: str
    status: str  # "running" | "completed" | "failed"
    topic: str
    pillar: str
    mock_mode: bool
    created_at: str
    finished_at: str | None = None
    elapsed_seconds: float | None = None
    error: str | None = None
    # Pipeline results (populated when status == "completed")
    compliance: dict | None = None
    corrections: int | None = None
    qc_passed: int | None = None
    qc_failed: int | None = None
    script_words: int | None = None
    blog_words: int | None = None
    newsletter_words: int | None = None
    seo: dict | None = None
    optimization: dict | None = None
    publish_status: dict | None = None


class HealthResponse(BaseModel):
    status: str
    version: str
    active_runs: int


class TopicResponse(BaseModel):
    topic: str
    pillar: str


# ── Topics queue helper ──────────────────────────────────────────────

def _pop_next_topic() -> dict | None:
    """Read topics_queue.yaml, find the first pending entry, mark it
    as 'scheduled', write back, and return {"topic": ..., "pillar": ...}.
    Returns None when the queue is empty or the file is missing."""
    if not TOPICS_QUEUE_PATH.exists():
        return None
    queue = yaml.safe_load(TOPICS_QUEUE_PATH.read_text(encoding="utf-8"))
    if not isinstance(queue, list):
        return None
    for entry in queue:
        if entry.get("status") == "pending":
            entry["status"] = "scheduled"
            TOPICS_QUEUE_PATH.write_text(
                yaml.dump(queue, default_flow_style=False, allow_unicode=True, sort_keys=False),
                encoding="utf-8",
            )
            return {"topic": entry["topic"], "pillar": entry["pillar"]}
    return None


# ── Background runner ─────────────────────────────────────────────────

def _execute_run(run_id: str, topic: str, pillar: str, mock_mode: bool) -> None:
    """Execute the pipeline in a background thread."""
    t0 = time.time()
    try:
        log.info("Run %s started -- topic='%s' pillar='%s' mock=%s", run_id, topic, pillar, mock_mode)
        final_state = run_pipeline(topic, pillar, mock_mode=mock_mode)

        # Extract summary
        metadata = final_state.get("metadata", {})
        qc_results = final_state.get("qc_results", [])
        passed = sum(1 for r in qc_results if r.get("passed"))
        compliance = final_state.get("compliance_result", {})
        opt = metadata.get("optimization", {})

        with _lock:
            _runs[run_id].update({
                "status": "completed",
                "finished_at": datetime.now(timezone.utc).isoformat(),
                "elapsed_seconds": round(time.time() - t0, 1),
                "compliance": compliance,
                "corrections": final_state.get("correction_count", 0),
                "qc_passed": passed,
                "qc_failed": len(qc_results) - passed,
                "script_words": len(final_state.get("script", "").split()),
                "blog_words": len(final_state.get("blog", "").split()),
                "newsletter_words": len(final_state.get("newsletter", "").split()),
                "seo": {
                    "youtube_title_a": metadata.get("youtube_title_a"),
                    "youtube_title_b": metadata.get("youtube_title_b"),
                    "primary_keyword": metadata.get("primary_keyword"),
                    "tags_count": len(metadata.get("youtube_tags", [])),
                },
                "optimization": {
                    "overall_score": opt.get("overall_score"),
                    "summary": opt.get("summary"),
                    "topic_recommendations": opt.get("topic_recommendations", []),
                },
                "publish_status": final_state.get("publish_status"),
            })
        log.info("Run %s completed in %.1fs", run_id, time.time() - t0)

    except Exception as exc:
        log.error("Run %s failed: %s", run_id, exc, exc_info=True)
        with _lock:
            _runs[run_id].update({
                "status": "failed",
                "finished_at": datetime.now(timezone.utc).isoformat(),
                "elapsed_seconds": round(time.time() - t0, 1),
                "error": str(exc),
            })


# ── Endpoints ─────────────────────────────────────────────────────────

@app.get("/topics/next", response_model=TopicResponse)
def next_topic():
    """Pop the next pending topic from the queue and return it."""
    result = _pop_next_topic()
    if result is None:
        raise HTTPException(404, "No pending topics in the queue.")
    return TopicResponse(**result)


@app.post("/run", response_model=RunResponse, status_code=202)
def start_run(req: RunRequest):
    """Trigger a pipeline run. Returns immediately with a run_id to poll."""
    pillar = req.pillar.upper()
    if pillar not in VALID_PILLARS:
        raise HTTPException(422, f"Invalid pillar '{pillar}'. Must be one of: {sorted(VALID_PILLARS)}")

    run_id = uuid.uuid4().hex[:12]
    now = datetime.now(timezone.utc).isoformat()

    with _lock:
        _runs[run_id] = {
            "run_id": run_id,
            "status": "running",
            "topic": req.topic,
            "pillar": pillar,
            "mock_mode": req.mock_mode,
            "created_at": now,
        }

    thread = threading.Thread(
        target=_execute_run,
        args=(run_id, req.topic, pillar, req.mock_mode),
        daemon=True,
    )
    thread.start()

    return RunResponse(
        run_id=run_id,
        status="running",
        topic=req.topic,
        pillar=pillar,
        mock_mode=req.mock_mode,
        created_at=now,
    )


@app.get("/status/{run_id}", response_model=StatusResponse)
def get_status(run_id: str):
    """Poll for pipeline run status and results."""
    with _lock:
        entry = _runs.get(run_id)
    if not entry:
        raise HTTPException(404, f"Run '{run_id}' not found")
    return StatusResponse(**entry)


@app.get("/health", response_model=HealthResponse)
def health_check():
    """Liveness check for n8n and monitoring."""
    with _lock:
        active = sum(1 for r in _runs.values() if r["status"] == "running")
    return HealthResponse(
        status="ok",
        version="3.8.2",
        active_runs=active,
    )
