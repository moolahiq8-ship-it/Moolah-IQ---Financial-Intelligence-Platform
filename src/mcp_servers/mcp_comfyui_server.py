"""MCP ComfyUI Server — Image and video generation workflow integration.

FastAPI server on port 8002. Provides tools for thumbnail generation,
B-roll generation, and job status monitoring via ComfyUI proxy.
"""

from __future__ import annotations

import logging
import os
import uuid
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

load_dotenv()

log = logging.getLogger("mcp-comfyui")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s %(message)s")

COMFYUI_URL = os.getenv("COMFYUI_URL", "http://localhost:8000")

app = FastAPI(title="MCP ComfyUI Server", version="1.0.0")


# ── Request models ────────────────────────────────────────────────────

class ThumbnailRequest(BaseModel):
    prompt: str
    style: str = "cinematic"
    dimensions: str = "1280x720"


class BrollRequest(BaseModel):
    prompt: str
    duration_sec: int = 5


class JobStatusRequest(BaseModel):
    job_id: str


# ── ComfyUI workflow helpers ──────────────────────────────────────────

def _build_thumbnail_workflow(prompt: str, style: str, width: int, height: int) -> dict[str, Any]:
    """Build a ComfyUI workflow JSON for thumbnail generation."""
    return {
        "3": {
            "class_type": "KSampler",
            "inputs": {
                "seed": -1,
                "steps": 25,
                "cfg": 7.5,
                "sampler_name": "euler_ancestral",
                "scheduler": "normal",
                "denoise": 1.0,
                "model": ["4", 0],
                "positive": ["6", 0],
                "negative": ["7", 0],
                "latent_image": ["5", 0],
            },
        },
        "4": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": "sd_xl_base_1.0.safetensors"},
        },
        "5": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": width, "height": height, "batch_size": 1},
        },
        "6": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": f"{prompt}, {style} style, YouTube thumbnail, high quality, vibrant",
                "clip": ["4", 1],
            },
        },
        "7": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": "blurry, low quality, watermark, text, deformed",
                "clip": ["4", 1],
            },
        },
        "8": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["3", 0], "vae": ["4", 2]},
        },
        "9": {
            "class_type": "SaveImage",
            "inputs": {"filename_prefix": "moolah_thumb", "images": ["8", 0]},
        },
    }


def _build_broll_workflow(prompt: str, duration_sec: int) -> dict[str, Any]:
    """Build a ComfyUI workflow JSON for B-roll video generation."""
    # Approximate frame count at 24fps
    frame_count = duration_sec * 24
    return {
        "1": {
            "class_type": "CheckpointLoaderSimple",
            "inputs": {"ckpt_name": "animatediff_lightning_4step.safetensors"},
        },
        "2": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": f"{prompt}, smooth motion, cinematic B-roll, 4K quality",
                "clip": ["1", 1],
            },
        },
        "3": {
            "class_type": "CLIPTextEncode",
            "inputs": {
                "text": "blurry, jitter, low quality, watermark",
                "clip": ["1", 1],
            },
        },
        "4": {
            "class_type": "EmptyLatentImage",
            "inputs": {"width": 1920, "height": 1080, "batch_size": frame_count},
        },
        "5": {
            "class_type": "KSampler",
            "inputs": {
                "seed": -1,
                "steps": 4,
                "cfg": 1.0,
                "sampler_name": "euler",
                "scheduler": "simple",
                "denoise": 1.0,
                "model": ["1", 0],
                "positive": ["2", 0],
                "negative": ["3", 0],
                "latent_image": ["4", 0],
            },
        },
        "6": {
            "class_type": "VAEDecode",
            "inputs": {"samples": ["5", 0], "vae": ["1", 2]},
        },
        "7": {
            "class_type": "SaveAnimatedWEBP",
            "inputs": {
                "filename_prefix": "moolah_broll",
                "fps": 24,
                "lossless": False,
                "quality": 85,
                "method": "default",
                "images": ["6", 0],
            },
        },
    }


# ── Startup / Health ──────────────────────────────────────────────────

@app.on_event("startup")
async def startup() -> None:
    log.info("[mcp-comfyui] Server starting on port 8002 | COMFYUI_URL=%s", COMFYUI_URL)


@app.get("/health")
async def health() -> dict[str, Any]:
    # Check if ComfyUI backend is reachable
    comfyui_ok = False
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{COMFYUI_URL}/system_stats")
            comfyui_ok = resp.status_code == 200
    except httpx.RequestError:
        pass

    return {
        "status": "ok",
        "service": "mcp-comfyui",
        "port": "8002",
        "comfyui_backend": "reachable" if comfyui_ok else "unreachable",
    }


@app.get("/tools")
async def list_tools() -> list[dict[str, Any]]:
    return [
        {
            "name": "generate_thumbnail",
            "description": "Generate a YouTube thumbnail image via ComfyUI.",
            "parameters": {
                "prompt": {"type": "string", "required": True},
                "style": {"type": "string", "default": "cinematic"},
                "dimensions": {"type": "string", "default": "1280x720"},
            },
        },
        {
            "name": "generate_broll",
            "description": "Generate B-roll video clip via ComfyUI.",
            "parameters": {
                "prompt": {"type": "string", "required": True},
                "duration_sec": {"type": "integer", "default": 5},
            },
        },
        {
            "name": "get_job_status",
            "description": "Check the status of a ComfyUI generation job.",
            "parameters": {"job_id": {"type": "string", "required": True}},
        },
    ]


# ── Tool endpoints ────────────────────────────────────────────────────

@app.post("/tools/generate_thumbnail")
async def generate_thumbnail(req: ThumbnailRequest) -> dict[str, Any]:
    """Queue a thumbnail generation workflow on ComfyUI."""
    log.info("[mcp-comfyui] generate_thumbnail: prompt=%s style=%s dims=%s", req.prompt, req.style, req.dimensions)

    try:
        parts = req.dimensions.split("x")
        width, height = int(parts[0]), int(parts[1])
    except (ValueError, IndexError):
        raise HTTPException(status_code=400, detail=f"Invalid dimensions format: {req.dimensions}. Use WxH, e.g. 1280x720")

    workflow = _build_thumbnail_workflow(req.prompt, req.style, width, height)
    client_id = str(uuid.uuid4())

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{COMFYUI_URL}/prompt",
                json={"prompt": workflow, "client_id": client_id},
            )
            resp.raise_for_status()
            data = resp.json()

        return {
            "job_id": data.get("prompt_id", client_id),
            "status": "queued",
            "type": "thumbnail",
            "prompt": req.prompt,
            "style": req.style,
            "dimensions": req.dimensions,
        }
    except httpx.HTTPStatusError as exc:
        log.error("[mcp-comfyui] ComfyUI API error: %s", exc.response.text)
        raise HTTPException(status_code=exc.response.status_code, detail="ComfyUI API error") from exc
    except httpx.RequestError as exc:
        log.error("[mcp-comfyui] Cannot reach ComfyUI: %s", exc)
        raise HTTPException(status_code=502, detail=f"Cannot reach ComfyUI at {COMFYUI_URL}") from exc


@app.post("/tools/generate_broll")
async def generate_broll(req: BrollRequest) -> dict[str, Any]:
    """Queue a B-roll video generation workflow on ComfyUI."""
    log.info("[mcp-comfyui] generate_broll: prompt=%s duration=%ds", req.prompt, req.duration_sec)

    if req.duration_sec < 1 or req.duration_sec > 30:
        raise HTTPException(status_code=400, detail="duration_sec must be between 1 and 30")

    workflow = _build_broll_workflow(req.prompt, req.duration_sec)
    client_id = str(uuid.uuid4())

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{COMFYUI_URL}/prompt",
                json={"prompt": workflow, "client_id": client_id},
            )
            resp.raise_for_status()
            data = resp.json()

        return {
            "job_id": data.get("prompt_id", client_id),
            "status": "queued",
            "type": "broll",
            "prompt": req.prompt,
            "duration_sec": req.duration_sec,
        }
    except httpx.HTTPStatusError as exc:
        log.error("[mcp-comfyui] ComfyUI API error: %s", exc.response.text)
        raise HTTPException(status_code=exc.response.status_code, detail="ComfyUI API error") from exc
    except httpx.RequestError as exc:
        log.error("[mcp-comfyui] Cannot reach ComfyUI: %s", exc)
        raise HTTPException(status_code=502, detail=f"Cannot reach ComfyUI at {COMFYUI_URL}") from exc


@app.post("/tools/get_job_status")
async def get_job_status(req: JobStatusRequest) -> dict[str, Any]:
    """Check the status of a queued ComfyUI job."""
    log.info("[mcp-comfyui] get_job_status: %s", req.job_id)

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{COMFYUI_URL}/history/{req.job_id}")
            resp.raise_for_status()
            data = resp.json()

        if req.job_id not in data:
            # Check if it's still in the queue
            queue_resp = await httpx.AsyncClient(timeout=10).__aenter__()
            try:
                qr = await queue_resp.get(f"{COMFYUI_URL}/queue")
                qr.raise_for_status()
                queue_data = qr.json()
                running = queue_data.get("queue_running", [])
                pending = queue_data.get("queue_pending", [])

                for item in running:
                    if len(item) > 1 and item[1] == req.job_id:
                        return {"job_id": req.job_id, "status": "running", "progress": None}
                for item in pending:
                    if len(item) > 1 and item[1] == req.job_id:
                        return {"job_id": req.job_id, "status": "pending", "queue_position": pending.index(item)}
            finally:
                await queue_resp.__aexit__(None, None, None)

            return {"job_id": req.job_id, "status": "not_found"}

        job = data[req.job_id]
        outputs = job.get("outputs", {})
        images = []
        for node_output in outputs.values():
            for img in node_output.get("images", []):
                images.append(f"{COMFYUI_URL}/view?filename={img['filename']}&subfolder={img.get('subfolder', '')}")

        return {
            "job_id": req.job_id,
            "status": "completed",
            "outputs": images,
        }
    except httpx.HTTPStatusError as exc:
        log.error("[mcp-comfyui] ComfyUI API error: %s", exc.response.text)
        raise HTTPException(status_code=exc.response.status_code, detail="ComfyUI API error") from exc
    except httpx.RequestError as exc:
        log.error("[mcp-comfyui] Cannot reach ComfyUI: %s", exc)
        raise HTTPException(status_code=502, detail=f"Cannot reach ComfyUI at {COMFYUI_URL}") from exc


# ── Main ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8002)
