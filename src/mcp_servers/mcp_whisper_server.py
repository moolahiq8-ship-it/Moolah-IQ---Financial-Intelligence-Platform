"""MCP Whisper Server — Speech-to-text via faster-whisper.

FastAPI server on port 8003. Provides tools for audio transcription,
caption generation in SRT/VTT formats, and silence detection.
"""

from __future__ import annotations

import logging
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

load_dotenv()

log = logging.getLogger("mcp-whisper")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s %(message)s")

WHISPER_MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "large-v3")
WHISPER_DEVICE = os.getenv("WHISPER_DEVICE", "auto")
WHISPER_COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "float16")

app = FastAPI(title="MCP Whisper Server", version="1.0.0")

# Lazy-loaded model instance
_model = None


def _get_model():
    """Lazy-load the faster-whisper model on first use."""
    global _model
    if _model is None:
        from faster_whisper import WhisperModel

        log.info("[mcp-whisper] Loading model: %s (device=%s, compute=%s)",
                 WHISPER_MODEL_SIZE, WHISPER_DEVICE, WHISPER_COMPUTE_TYPE)
        _model = WhisperModel(WHISPER_MODEL_SIZE, device=WHISPER_DEVICE, compute_type=WHISPER_COMPUTE_TYPE)
        log.info("[mcp-whisper] Model loaded successfully")
    return _model


# ── Request models ────────────────────────────────────────────────────

class TranscribeRequest(BaseModel):
    file_path: str


class CaptionRequest(BaseModel):
    file_path: str
    format: str = "srt"


class SilenceRequest(BaseModel):
    file_path: str
    min_duration_sec: float = 1.0
    threshold_db: float = -40.0


# ── Helpers ───────────────────────────────────────────────────────────

def _format_timestamp_srt(seconds: float) -> str:
    """Convert seconds to SRT timestamp format (HH:MM:SS,mmm)."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def _format_timestamp_vtt(seconds: float) -> str:
    """Convert seconds to VTT timestamp format (HH:MM:SS.mmm)."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def _validate_audio_path(file_path: str) -> Path:
    """Validate that an audio file exists and has a supported extension."""
    path = Path(file_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail=f"File not found: {file_path}")
    valid_exts = {".mp3", ".wav", ".flac", ".ogg", ".m4a", ".mp4", ".webm", ".mkv"}
    if path.suffix.lower() not in valid_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {path.suffix}")
    return path


# ── Startup / Health ──────────────────────────────────────────────────

@app.on_event("startup")
async def startup() -> None:
    log.info("[mcp-whisper] Server starting on port 8003 | model=%s device=%s",
             WHISPER_MODEL_SIZE, WHISPER_DEVICE)


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "mcp-whisper",
        "port": "8003",
        "model": WHISPER_MODEL_SIZE,
        "model_loaded": _model is not None,
    }


@app.get("/tools")
async def list_tools() -> list[dict[str, Any]]:
    return [
        {
            "name": "transcribe_audio",
            "description": "Transcribe an audio/video file to timestamped text segments.",
            "parameters": {"file_path": {"type": "string", "required": True}},
        },
        {
            "name": "generate_captions",
            "description": "Generate caption file (SRT or VTT) from audio/video.",
            "parameters": {
                "file_path": {"type": "string", "required": True},
                "format": {"type": "string", "default": "srt", "enum": ["srt", "vtt"]},
            },
        },
        {
            "name": "detect_silence",
            "description": "Detect silent segments in an audio/video file.",
            "parameters": {
                "file_path": {"type": "string", "required": True},
                "min_duration_sec": {"type": "number", "default": 1.0},
                "threshold_db": {"type": "number", "default": -40.0},
            },
        },
    ]


# ── Tool endpoints ────────────────────────────────────────────────────

@app.post("/tools/transcribe_audio")
async def transcribe_audio(req: TranscribeRequest) -> dict[str, Any]:
    """Transcribe an audio file and return timestamped segments."""
    path = _validate_audio_path(req.file_path)
    log.info("[mcp-whisper] transcribe_audio: %s", path)

    try:
        model = _get_model()
        segments_iter, info = model.transcribe(str(path), beam_size=5, word_timestamps=True)

        segments = []
        full_text_parts = []
        for seg in segments_iter:
            segment_data = {
                "start": round(seg.start, 3),
                "end": round(seg.end, 3),
                "text": seg.text.strip(),
            }
            if seg.words:
                segment_data["words"] = [
                    {"word": w.word, "start": round(w.start, 3), "end": round(w.end, 3), "probability": round(w.probability, 3)}
                    for w in seg.words
                ]
            segments.append(segment_data)
            full_text_parts.append(seg.text.strip())

        return {
            "file": req.file_path,
            "language": info.language,
            "language_probability": round(info.language_probability, 3),
            "duration_sec": round(info.duration, 2),
            "segment_count": len(segments),
            "full_text": " ".join(full_text_parts),
            "segments": segments,
        }
    except Exception as exc:
        log.error("[mcp-whisper] Transcription failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Transcription failed: {exc}") from exc


@app.post("/tools/generate_captions")
async def generate_captions(req: CaptionRequest) -> dict[str, Any]:
    """Generate an SRT or VTT caption file from audio."""
    path = _validate_audio_path(req.file_path)
    fmt = req.format.lower()
    if fmt not in ("srt", "vtt"):
        raise HTTPException(status_code=400, detail=f"Unsupported format: {req.format}. Use 'srt' or 'vtt'.")

    log.info("[mcp-whisper] generate_captions: %s format=%s", path, fmt)

    try:
        model = _get_model()
        segments_iter, info = model.transcribe(str(path), beam_size=5)

        output_path = path.with_suffix(f".{fmt}")
        lines = []

        if fmt == "vtt":
            lines.append("WEBVTT\n")

        for i, seg in enumerate(segments_iter, 1):
            if fmt == "srt":
                lines.append(str(i))
                lines.append(f"{_format_timestamp_srt(seg.start)} --> {_format_timestamp_srt(seg.end)}")
            else:
                lines.append(f"{_format_timestamp_vtt(seg.start)} --> {_format_timestamp_vtt(seg.end)}")
            lines.append(seg.text.strip())
            lines.append("")

        content = "\n".join(lines)
        output_path.write_text(content, encoding="utf-8")

        return {
            "file": req.file_path,
            "format": fmt,
            "output_path": str(output_path),
            "duration_sec": round(info.duration, 2),
            "language": info.language,
        }
    except Exception as exc:
        log.error("[mcp-whisper] Caption generation failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Caption generation failed: {exc}") from exc


@app.post("/tools/detect_silence")
async def detect_silence(req: SilenceRequest) -> dict[str, Any]:
    """Detect silent segments in an audio/video file using faster-whisper VAD."""
    path = _validate_audio_path(req.file_path)
    log.info("[mcp-whisper] detect_silence: %s (min_dur=%.1fs, threshold=%.1fdB)",
             path, req.min_duration_sec, req.threshold_db)

    try:
        model = _get_model()
        # Use faster-whisper's built-in VAD to detect speech segments,
        # then infer silence as the gaps between them.
        segments_iter, info = model.transcribe(
            str(path),
            beam_size=5,
            vad_filter=True,
            vad_parameters={"min_silence_duration_ms": int(req.min_duration_sec * 1000)},
        )

        speech_segments = []
        for seg in segments_iter:
            speech_segments.append({"start": round(seg.start, 3), "end": round(seg.end, 3)})

        # Derive silence segments from gaps between speech
        silent_segments = []
        duration = info.duration
        prev_end = 0.0
        for sp in speech_segments:
            gap = sp["start"] - prev_end
            if gap >= req.min_duration_sec:
                silent_segments.append({
                    "start": round(prev_end, 3),
                    "end": round(sp["start"], 3),
                    "duration": round(gap, 3),
                })
            prev_end = sp["end"]

        # Check for trailing silence
        if duration - prev_end >= req.min_duration_sec:
            silent_segments.append({
                "start": round(prev_end, 3),
                "end": round(duration, 3),
                "duration": round(duration - prev_end, 3),
            })

        total_silence = sum(s["duration"] for s in silent_segments)
        return {
            "file": req.file_path,
            "duration_sec": round(duration, 2),
            "silent_segment_count": len(silent_segments),
            "total_silence_sec": round(total_silence, 2),
            "silence_percentage": round((total_silence / duration) * 100, 1) if duration > 0 else 0,
            "silent_segments": silent_segments,
        }
    except Exception as exc:
        log.error("[mcp-whisper] Silence detection failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Silence detection failed: {exc}") from exc


# ── Main ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8003)
