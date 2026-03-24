"""Tests for the PipelineState schema and related types."""

from __future__ import annotations

from src.state import ComplianceResult, PipelineState, PublishStatus, QCResult


def test_pipeline_state_minimal():
    """A PipelineState can be created with just a topic."""
    state: PipelineState = {"topic": "Emergency Fund Basics"}
    assert state["topic"] == "Emergency Fund Basics"


def test_pipeline_state_full():
    """A PipelineState can hold all fields."""
    state: PipelineState = {
        "topic": "Estate Planning 101",
        "pillar": "LEGACY",
        "script": "Hook: Did you know...",
        "blog": "<h1>Estate Planning 101</h1>",
        "newsletter": "Subject: Don't skip this step",
        "visuals": {"thumbnail": "/tmp/thumb.png"},
        "audio": {"tts": "/tmp/tts.wav"},
        "metadata": {"youtube_title": "Estate Planning 101"},
        "qc_results": [
            {"check_id": "QC-01", "name": "Hook impact", "passed": True, "details": "OK"},
        ],
        "compliance_result": {
            "approved": True,
            "flags": [],
            "reviewer": "compliance-agent",
            "timestamp": "2026-02-19T00:00:00Z",
        },
        "publish_status": {
            "youtube": "published",
            "blog": "published",
            "newsletter": "published",
            "social": "published",
        },
        "correction_count": 0,
        "failure_memory": [],
    }
    assert state["pillar"] == "LEGACY"
    assert state["compliance_result"]["approved"] is True
    assert len(state["qc_results"]) == 1


def test_qc_result_structure():
    """QCResult has the expected keys."""
    result: QCResult = {
        "check_id": "QC-01",
        "name": "Hook impact",
        "passed": True,
        "details": "Strong pattern interrupt",
    }
    assert result["passed"] is True


def test_compliance_result_structure():
    """ComplianceResult has the expected keys."""
    result: ComplianceResult = {
        "approved": False,
        "flags": ["missing-disclaimer"],
        "reviewer": "compliance-agent",
        "timestamp": "2026-02-19T12:00:00Z",
    }
    assert result["approved"] is False
    assert "missing-disclaimer" in result["flags"]


def test_publish_status_structure():
    """PublishStatus tracks per-platform status."""
    status: PublishStatus = {
        "youtube": "scheduled",
        "blog": "published",
        "newsletter": "pending",
        "social": "pending",
    }
    assert status["youtube"] == "scheduled"
