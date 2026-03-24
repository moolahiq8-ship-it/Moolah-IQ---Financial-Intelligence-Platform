"""Production Agent — Gemini Image + rembg + Pillow + Wan 2.2 + Qwen3-TTS + YouTube.

Orchestrates visual generation (Gemini 2.5 Flash Image API), thumbnail
composition (Pillow), video clip generation (Wan 2.2 via ComfyUI), voice
synthesis (Qwen3-TTS), video assembly (MoviePy), and YouTube upload.

Thumbnail pipeline (3-stage):
  1. Gemini generates a studio-quality subject image (white bg, no text).
  2. rembg removes the background -> clean RGBA cutout, cropped to content.
  3. Pillow composes the final thumbnail: dark navy gradient + person cutout
     on right + bold title text on left + green $-highlight + badge + watermark.

Video pipeline (directive V3.8.8.4 — sentence-level chunking):
  1. Parse script into [SECTION] scenes (HOOK, INTRO, MAIN, CTA, etc.).
  2. Split each section into 1-2 sentence chunks (target: 96-144 clips).
  3. For each chunk: generate ~5s Wan 2.2 clip via ComfyUI + TTS audio.
  4. Loop each clip to match its TTS duration, apply crossfade transitions.
  5. Concatenate into final 1080p MP4 with MoviePy.
  6. Upload to YouTube as private with SEO metadata + thumbnail.
  Clip naming: PILLAR-CATEGORY-DESCRIPTOR-AGE-CULTURE-SCENE-ID.mp4

All text rendering is Pillow-only.  AI-generated text is always garbled.
Cost: ~$0.04/thumbnail via gemini-2.5-flash-image.
"""

from __future__ import annotations

import copy
import logging
import os
import random
import re
import time
import uuid
from pathlib import Path
from typing import Any

import httpx
import numpy as np
from dotenv import load_dotenv
from google import genai
from google.genai import types as genai_types
from PIL import Image, ImageDraw, ImageFont
from rembg import remove as rembg_remove

from src.state import PipelineState

load_dotenv()

log = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_IMAGE_MODEL = os.getenv("GEMINI_IMAGE_MODEL", "gemini-2.5-flash-image")
TTS_URL = os.getenv("TTS_URL", "http://localhost:8003")
COMFYUI_URL = os.getenv("COMFYUI_URL", "http://localhost:8000")
# Output directories — all on D: drive per directive V3.8.8.4
OUTPUT_DIR_VIDEO = Path(os.getenv("OUTPUT_DIR_VIDEO", r"D:\Output\video"))
OUTPUT_DIR_THUMBNAILS = Path(os.getenv("OUTPUT_DIR_THUMBNAILS", r"D:\Output\thumbnails"))
OUTPUT_DIR_TTS = Path(os.getenv("OUTPUT_DIR_TTS", r"D:\Output\tts"))
OUTPUT_DIR_TIKTOK = Path(os.getenv("OUTPUT_DIR_TIKTOK", r"D:\Output\TikTok"))
OUTPUT_DIR_BROLL = Path(os.getenv("OUTPUT_DIR_BROLL", r"D:\MoolahIQ_BRoll"))
# Legacy alias — any code referencing OUTPUT_DIR gets video output dir
OUTPUT_DIR = OUTPUT_DIR_VIDEO

SYSTEM_PROMPT = """\
You are the Moolah IQ Production Agent. You coordinate:

1. **Visual Generation** (Gemini Image API):
   - Generate studio-quality subject images via Gemini 2.5 Flash Image.
   - White background for clean rembg cutout extraction.
   - Pillow composites the final thumbnail (dark navy gradient + text).

2. **Video Generation** (Wan 2.2 via ComfyUI):
   - Generate ~5-second cinematic clips per script section.
   - 4-step LoRA accelerated pipeline (~2-4 min/clip on RTX 5090).
   - 1920x1080 native resolution, 16fps, 81 frames per clip.

3. **Voice Synthesis** (Qwen3-TTS):
   - Convert script sections to speech with the Moolah IQ voice profile.
   - Target pacing: 150-160 WPM.
   - Insert natural pauses at section breaks.

4. **Video Assembly** (MoviePy):
   - Loop video clips to match TTS audio duration.
   - Apply crossfade transitions between sections.
   - Export at 1080p, 30fps, H.264 + AAC.

5. **YouTube Upload** (YouTube Data API v3):
   - Upload as private for review.
   - Set SEO metadata (title, description, tags) and thumbnail.

Never proceed if any asset fails quality check. Report errors to state.
"""

# ── Wan 2.2 T2V API Workflow (4-step LoRA accelerated) ─────────────────
# Extracted from T2V_wan22_14B.json — active pipeline (mode=0 nodes only).
# Two-stage sampling: high-noise UNet (steps 0-2) -> low-noise UNet (steps 2-4).
# Runtime modifications: node 89 (prompt), 81 (seed), 74 (resolution), 80 (prefix).
WAN22_T2V_WORKFLOW: dict[str, Any] = {
    "71": {
        "class_type": "CLIPLoader",
        "inputs": {
            "clip_name": "umt5_xxl_fp8_e4m3fn_scaled.safetensors",
            "type": "wan",
            "device": "default",
        },
    },
    "73": {
        "class_type": "VAELoader",
        "inputs": {
            "vae_name": "wan_2.1_vae.safetensors",
        },
    },
    "74": {
        "class_type": "EmptyHunyuanLatentVideo",
        "inputs": {
            "width": 1280,
            "height": 720,
            "length": 41,
            "batch_size": 1,
        },
    },
    "75": {
        "class_type": "UNETLoader",
        "inputs": {
            "unet_name": "wan2.2_t2v_high_noise_14B_fp8_scaled.safetensors",
            "weight_dtype": "default",
        },
    },
    "76": {
        "class_type": "UNETLoader",
        "inputs": {
            "unet_name": "wan2.2_t2v_low_noise_14B_fp8_scaled.safetensors",
            "weight_dtype": "default",
        },
    },
    "83": {
        "class_type": "LoraLoaderModelOnly",
        "inputs": {
            "model": ["75", 0],
            "lora_name": "wan2.2_t2v_lightx2v_4steps_lora_v1.1_high_noise.safetensors",
            "strength_model": 1.0,
        },
    },
    "85": {
        "class_type": "LoraLoaderModelOnly",
        "inputs": {
            "model": ["76", 0],
            "lora_name": "wan2.2_t2v_lightx2v_4steps_lora_v1.1_low_noise.safetensors",
            "strength_model": 1.0,
        },
    },
    "82": {
        "class_type": "ModelSamplingSD3",
        "inputs": {
            "model": ["83", 0],
            "shift": 5.0,
        },
    },
    "86": {
        "class_type": "ModelSamplingSD3",
        "inputs": {
            "model": ["85", 0],
            "shift": 5.0,
        },
    },
    "89": {
        "class_type": "CLIPTextEncode",
        "_meta": {"title": "CLIP Text Encode (Positive Prompt)"},
        "inputs": {
            "clip": ["71", 0],
            "text": "",
        },
    },
    "72": {
        "class_type": "CLIPTextEncode",
        "_meta": {"title": "CLIP Text Encode (Negative Prompt)"},
        "inputs": {
            "clip": ["71", 0],
            "text": "",
        },
    },
    "81": {
        "class_type": "KSamplerAdvanced",
        "_meta": {"title": "KSampler High-Noise Pass"},
        "inputs": {
            "model": ["82", 0],
            "positive": ["89", 0],
            "negative": ["72", 0],
            "latent_image": ["74", 0],
            "add_noise": "enable",
            "noise_seed": 0,
            "steps": 4,
            "cfg": 1,
            "sampler_name": "euler",
            "scheduler": "simple",
            "start_at_step": 0,
            "end_at_step": 2,
            "return_with_leftover_noise": "enable",
        },
    },
    "78": {
        "class_type": "KSamplerAdvanced",
        "_meta": {"title": "KSampler Low-Noise Pass"},
        "inputs": {
            "model": ["86", 0],
            "positive": ["89", 0],
            "negative": ["72", 0],
            "latent_image": ["81", 0],
            "add_noise": "disable",
            "noise_seed": 0,
            "steps": 4,
            "cfg": 1,
            "sampler_name": "euler",
            "scheduler": "simple",
            "start_at_step": 2,
            "end_at_step": 4,
            "return_with_leftover_noise": "disable",
        },
    },
    "87": {
        "class_type": "VAEDecode",
        "inputs": {
            "samples": ["78", 0],
            "vae": ["73", 0],
        },
    },
    "88": {
        "class_type": "CreateVideo",
        "inputs": {
            "images": ["87", 0],
            "fps": 16,
        },
    },
    "80": {
        "class_type": "SaveVideo",
        "inputs": {
            "video": ["88", 0],
            "filename_prefix": "video/MoolahIQ",
            "format": "auto",
            "codec": "auto",
        },
    },
}


class ProductionAgent:
    """Coordinates Gemini Image, Wan 2.2, Qwen3-TTS, MoviePy, and YouTube."""

    def __init__(self) -> None:
        self.name = "production"
        self.tts_url = TTS_URL
        self._gemini_client: genai.Client | None = None
        log.info("[%s] Initialized (image_model=%s, tts=%s, comfyui=%s)",
                 self.name, GEMINI_IMAGE_MODEL, self.tts_url, COMFYUI_URL)

    def _get_gemini_client(self) -> genai.Client:
        """Lazy-init Gemini client (reuse across calls)."""
        if self._gemini_client is None:
            self._gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        return self._gemini_client

    # -- Thumbnail composition (3-stage: Gemini -> rembg -> Pillow) -----------
    # AI models produce garbled text. Thumbnail pipeline:
    #   1. Gemini generates a studio-quality subject image (white bg).
    #   2. rembg removes the background -> clean RGBA cutout.
    #   3. Pillow composes: dark gradient bg + cutout + bold text + badge.

    # Font paths (Windows defaults; override via env if needed)
    FONT_TITLE = os.getenv("THUMB_FONT_TITLE", "C:/Windows/Fonts/impact.ttf")
    FONT_SUBTITLE = os.getenv("THUMB_FONT_SUBTITLE", "C:/Windows/Fonts/arialbd.ttf")
    # Brand colors
    COLOR_GREEN = (52, 220, 110)    # Moolah IQ accent green
    COLOR_WHITE = (255, 255, 255)
    THUMB_W, THUMB_H = 1280, 720

    def _build_thumbnail(self, base_path: str, title: str) -> str:
        """Build a YouTube-style thumbnail from a Gemini-generated image.

        Three stages:
          1. Extract person cutout from Gemini image via rembg, crop to content.
          2. Compose dark navy gradient background.
          3. Render bold title (left), person (right), badge, watermark.

        Dollar amounts (e.g. $500) are auto-detected and rendered in green
        at a larger font size for emphasis.

        Args:
            base_path: Path to the Gemini-generated base PNG.
            title: The video title to render.

        Returns:
            Path to the final composed thumbnail PNG.
        """
        W, H = self.THUMB_W, self.THUMB_H

        # -- Stage 1: rembg person cutout --
        base_img = Image.open(base_path).convert("RGBA")
        try:
            person = rembg_remove(base_img)
            log.info("[%s] rembg cutout extracted from %s", self.name, base_path)
        except Exception as exc:
            log.warning("[%s] rembg failed (%s) -- using base image as-is", self.name, exc)
            person = base_img

        # Crop to content bounding box (remove empty transparent space)
        arr_alpha = np.array(person)[:, :, 3]
        rows = np.any(arr_alpha > 10, axis=1)
        cols = np.any(arr_alpha > 10, axis=0)
        if rows.any() and cols.any():
            rmin, rmax = int(np.where(rows)[0][0]), int(np.where(rows)[0][-1])
            cmin, cmax = int(np.where(cols)[0][0]), int(np.where(cols)[0][-1])
            person = person.crop((cmin, rmin, cmax + 1, rmax + 1))

        # -- Stage 2: Dark navy gradient background --
        arr = np.zeros((H, W, 3), dtype=np.uint8)
        for y in range(H):
            t = y / H
            arr[y, :, 0] = int(12 - 4 * t)   # R: 12 -> 8
            arr[y, :, 1] = int(18 - 6 * t)   # G: 18 -> 12
            arr[y, :, 2] = int(44 - 12 * t)  # B: 44 -> 32
        bg = Image.fromarray(arr, "RGB").convert("RGBA")

        # -- Paste person cutout (right side, fully visible) --
        ph = int(H * 0.88)
        pw = int(ph * person.width / person.height)
        person = person.resize((pw, ph), Image.LANCZOS)
        px = W - pw - 30  # 30px padding from right edge
        py = H - ph - 10
        bg.paste(person, (px, py), person)

        # Bottom vignette
        vignette = Image.new("RGBA", (W, H), (0, 0, 0, 0))
        vd = ImageDraw.Draw(vignette)
        for y in range(H - 80, H):
            a = int(120 * ((y - (H - 80)) / 80) ** 2)
            vd.line([(0, y), (W, y)], fill=(0, 0, 0, a))
        bg = Image.alpha_composite(bg, vignette)

        canvas = bg.convert("RGB")
        draw = ImageDraw.Draw(canvas)

        # -- Stage 3: Pillow text rendering --
        try:
            font_title = ImageFont.truetype(self.FONT_TITLE, 80)
            font_money = ImageFont.truetype(self.FONT_TITLE, 112)
            font_badge = ImageFont.truetype(self.FONT_SUBTITLE, 28)
            font_logo = ImageFont.truetype(self.FONT_SUBTITLE, 20)
        except OSError:
            log.warning("[%s] Font not found -- using default", self.name)
            font_title = ImageFont.load_default(size=80)
            font_money = ImageFont.load_default(size=112)
            font_badge = ImageFont.load_default(size=28)
            font_logo = ImageFont.load_default(size=20)

        def _txt(pos, text, font, fill, sh=4):
            """Render text with double drop shadow for depth."""
            x, y = pos
            draw.text((x + sh, y + sh), text, fill=(0, 0, 0), font=font)
            draw.text((x + sh // 2, y + sh // 2), text, fill=(10, 10, 10), font=font)
            draw.text(pos, text, fill=fill, font=font)

        # Parse dollar amount for green highlight
        money_match = re.search(r"\$[\d,]+", title)
        money_str = money_match.group(0) if money_match else ""

        # Break title into lines (~18 chars each, break at dollar amount)
        words = title.upper().split()
        lines: list[str] = []
        current: list[str] = []
        for word in words:
            current.append(word)
            joined = " ".join(current)
            if len(joined) > 18 or (money_str and word == money_str.upper()):
                lines.append(joined)
                current = []
        if current:
            lines.append(" ".join(current))

        # Render title lines (left side)
        x0 = 55
        y = 100
        for line in lines:
            if money_str and money_str.upper() in line:
                parts = line.split(money_str.upper())
                before = parts[0]
                after = parts[1] if len(parts) > 1 else ""
                if before.strip():
                    _txt((x0, y), before.rstrip(), font_title, self.COLOR_WHITE)
                    bw = font_title.getbbox(before)[2]
                else:
                    bw = 0
                _txt((x0 + bw, y - 16), money_str.upper(), font_money, self.COLOR_GREEN, sh=5)
                mw = font_money.getbbox(money_str.upper())[2]
                if after.strip():
                    _txt((x0 + bw + mw + 5, y), after.lstrip(), font_title, self.COLOR_WHITE)
                y += 112
            else:
                _txt((x0, y), line, font_title, self.COLOR_WHITE)
                y += 92
        y += 8

        # Step-by-Step Guide badge
        badge = "Step-by-Step Guide"
        bb = font_badge.getbbox(badge)
        bw, bh = bb[2] + 32, bb[3] + 20
        draw.rounded_rectangle(
            [(x0, y), (x0 + bw, y + bh)], radius=10, fill=self.COLOR_GREEN,
        )
        draw.text((x0 + 15, y + 8), badge, fill=self.COLOR_WHITE, font=font_badge)

        # MOOLAHIQ watermark (bottom-right, subtle)
        logo = "MOOLAHIQ"
        lb = font_logo.getbbox(logo)
        lx = W - lb[2] - 25
        ly = H - lb[3] - 18
        draw.text((lx + 1, ly + 1), logo, fill=(5, 10, 20), font=font_logo)
        draw.text((lx, ly), logo, fill=(70, 90, 120), font=font_logo)

        # -- Save --
        out_path = base_path.replace(".png", "_final.png")
        canvas.save(out_path, quality=95)
        log.info("[%s] Thumbnail composed -> %s (%dx%d)", self.name, out_path, W, H)
        return out_path

    # -- HTTP helper -------------------------------------------------------

    def _post(self, url: str, json_body: dict, label: str = "request",
              timeout: int = 60) -> dict[str, Any] | None:
        """POST with graceful error handling -- returns None on failure."""
        try:
            resp = httpx.post(url, json=json_body, timeout=timeout)
            resp.raise_for_status()
            return resp.json()
        except httpx.ConnectError:
            log.warning("[%s] %s: connection refused at %s -- is the service running?",
                        self.name, label, url)
        except httpx.HTTPStatusError as exc:
            log.warning("[%s] %s: HTTP %d -- %s",
                        self.name, label, exc.response.status_code,
                        exc.response.text[:200])
        except Exception as exc:
            log.warning("[%s] %s: failed -- %s", self.name, label, exc)
        return None

    # -- Thumbnail generation (Gemini Image API) ---------------------------

    def generate_thumbnail(self, state: PipelineState) -> str | None:
        """Generate a subject image via Gemini 2.5 Flash Image API.

        Produces a studio-quality portrait on a white background, ideal
        for rembg cutout extraction.  Returns the local file path on
        success, or None on failure.  Cost: ~$0.04/image.
        """
        if not GEMINI_API_KEY:
            log.warning("[%s] GEMINI_API_KEY not set -- thumbnail generation skipped", self.name)
            return None

        topic = state.get("topic", "personal finance")
        prompt_text = (
            f"Professional studio portrait of a confident young man in his "
            f"late 20s with short brown hair and light stubble beard, wearing "
            f"a dark navy blue t-shirt, sitting at a desk, looking directly "
            f"at camera with a friendly smile, holding a pen in his right hand "
            f"with both hands resting on the desk and fully visible including "
            f"fingers, clean white studio background, upper body shot from "
            f"chest up, professional YouTube creator aesthetic, topic: {topic}, "
            f"photorealistic, high quality, NO text NO words NO watermark NO logos"
        )

        log.info("[%s] Generating subject image via %s", self.name, GEMINI_IMAGE_MODEL)

        try:
            client = self._get_gemini_client()
            response = client.models.generate_content(
                model=GEMINI_IMAGE_MODEL,
                contents=prompt_text,
                config=genai_types.GenerateContentConfig(
                    response_modalities=["TEXT", "IMAGE"],
                ),
            )

            # Extract image from response parts
            for part in response.candidates[0].content.parts:
                if hasattr(part, "inline_data") and part.inline_data:
                    OUTPUT_DIR_THUMBNAILS.mkdir(parents=True, exist_ok=True)
                    out_path = OUTPUT_DIR_THUMBNAILS / f"thumbnail_{uuid.uuid4().hex[:8]}.png"
                    out_path.write_bytes(part.inline_data.data)
                    log.info("[%s] Gemini image saved -> %s (%d bytes)",
                             self.name, out_path, len(part.inline_data.data))
                    return str(out_path)

            log.warning("[%s] Gemini response contained no image data", self.name)
            return None

        except Exception as exc:
            log.warning("[%s] Gemini image generation failed: %s", self.name, exc)
            return None

    # -- Voiceover generation (Qwen3-TTS) ----------------------------------

    def generate_voiceover(self, state: PipelineState) -> str | None:
        """Generate full-script voiceover using Qwen3-TTS (Aiden voice).

        Generates the entire script as a single Aiden voiceover via subprocess
        call to qwenTTS.py in the qwen3-tts conda env.

        Returns the local file path on success, or None on failure.
        """
        script = state.get("script", "")
        if not script:
            log.warning("[%s] No script in state -- skipping TTS", self.name)
            return None

        OUTPUT_DIR_TTS.mkdir(parents=True, exist_ok=True)
        out_path = str(OUTPUT_DIR_TTS / f"tts_{uuid.uuid4().hex[:8]}.mp3")

        log.info("[%s] Generating full voiceover via Qwen3-TTS (Aiden), %d words",
                 self.name, len(script.split()))

        ok = self._generate_section_tts(script, out_path, section="NARRATION")
        if ok:
            return out_path
        return None

    # -- Workflow format conversion ----------------------------------------

    @staticmethod
    def _convert_ui_to_api(raw: dict) -> dict:
        """Convert ComfyUI UI-format workflow to API-format for /prompt.

        UI format (saved from canvas): {nodes: [...], links: [...], ...}
        API format (for /prompt):      {node_id: {class_type, inputs}, ...}

        Handles subgraph nodes by expanding inner nodes with prefixed IDs.
        Returns the input unchanged if already in API format.
        """
        if "nodes" not in raw:
            return raw

        nodes_list = raw["nodes"]
        links_list = raw.get("links", [])
        sg_defs = {
            sg["id"]: sg
            for sg in raw.get("definitions", {}).get("subgraphs", [])
        }

        # link_id -> (origin_node_id, origin_slot)
        link_map: dict[int, tuple[int, int]] = {}
        for lnk in links_list:
            link_map[lnk[0]] = (lnk[1], lnk[2])

        api: dict[str, dict] = {}
        # Track subgraph output remaps for fixup pass
        output_remap: dict[tuple[str, int], tuple[str, int]] = {}

        for node in nodes_list:
            ntype = node.get("type", "")
            if ntype in sg_defs:
                ProductionAgent._expand_subgraph_node(
                    api, node, sg_defs[ntype], link_map, output_remap,
                )
                continue

            nid = str(node["id"])
            inputs_def = node.get("inputs", [])
            wv = node.get("widgets_values", [])

            api_inputs: dict[str, Any] = {}

            # Widget values: dict (named) or list (positional)
            if isinstance(wv, dict):
                for k, v in wv.items():
                    if k != "videopreview":
                        api_inputs[k] = v
            elif isinstance(wv, (list, tuple)):
                wi = 0
                for inp in inputs_def:
                    if "widget" in inp:
                        if wi < len(wv) and wv[wi] is not None:
                            api_inputs[inp["widget"]["name"]] = wv[wi]
                        wi += 1
                        # Skip phantom control_after_generate after seed widgets
                        if inp["widget"]["name"] == "seed" and wi < len(wv):
                            wi += 1

            # Resolve link connections (override widgets where linked)
            for inp in inputs_def:
                lid = inp.get("link")
                if lid is not None and lid in link_map:
                    oid, oslot = link_map[lid]
                    api_inputs[inp["name"]] = [str(oid), oslot]

            api[nid] = {"class_type": ntype, "inputs": api_inputs}

        # Fix references to subgraph outputs -> actual inner output nodes
        for ndata in api.values():
            for key, val in list(ndata.get("inputs", {}).items()):
                if isinstance(val, list) and len(val) == 2:
                    rk = (str(val[0]), val[1])
                    if rk in output_remap:
                        ndata["inputs"][key] = list(output_remap[rk])

        log.info("Converted UI-format workflow to API format: %d nodes", len(api))
        return api

    @staticmethod
    def _expand_subgraph_node(
        api: dict,
        outer_node: dict,
        sg_def: dict,
        outer_link_map: dict[int, tuple[int, int]],
        output_remap: dict[tuple[str, int], tuple[str, int]],
    ) -> None:
        """Expand a subgraph node into flat API nodes with prefixed IDs.

        Resolves subgraph inputs from the outer node's widget values (via
        proxyWidgets) and linked connections.  Inner node IDs are prefixed
        with ``sg{outer_id}_`` to avoid collisions.
        """
        outer_id = outer_node["id"]
        prefix = f"sg{outer_id}_"

        sg_nodes = sg_def.get("nodes", [])
        sg_links = sg_def.get("links", [])
        sg_inputs = sg_def.get("inputs", [])
        sg_outputs = sg_def.get("outputs", [])

        proxy_widgets = outer_node.get("properties", {}).get("proxyWidgets", [])
        outer_wv = outer_node.get("widgets_values", [])

        # -- Resolve subgraph input values from outer node --
        sg_input_values: dict[str, Any] = {}
        direct_overrides: dict[int, dict[str, Any]] = {}

        if proxy_widgets and isinstance(outer_wv, list):
            for i, pw in enumerate(proxy_widgets):
                if i >= len(outer_wv):
                    break
                target_node, target_name = pw[0], pw[1]
                if target_node == "-1":
                    sg_input_values[target_name] = outer_wv[i]
                else:
                    direct_overrides.setdefault(
                        int(target_node), {},
                    )[target_name] = outer_wv[i]
        else:
            # Fallback: match outer inputs to subgraph inputs by position
            wi = 0
            for outer_inp in outer_node.get("inputs", []):
                if "widget" in outer_inp and isinstance(outer_wv, list):
                    if wi < len(outer_wv):
                        sg_input_values[outer_inp["name"]] = outer_wv[wi]
                    wi += 1

        # Linked outer inputs override widget values
        for outer_inp in outer_node.get("inputs", []):
            lid = outer_inp.get("link")
            if lid is not None and lid in outer_link_map:
                oid, oslot = outer_link_map[lid]
                sg_input_values[outer_inp["name"]] = [str(oid), oslot]

        # Map virtual input node (-10) output slots to resolved values
        input_slot_values: dict[int, Any] = {}
        for slot_idx, sg_inp in enumerate(sg_inputs):
            name = sg_inp["name"]
            if name in sg_input_values:
                input_slot_values[slot_idx] = sg_input_values[name]

        # -- Classify inner links --
        inner_link_map: dict[int, tuple[int, int]] = {}
        from_input_node: dict[int, int] = {}
        to_output_node: dict[int, tuple[int, int]] = {}

        for lnk in sg_links:
            # Inner links may be dicts (named keys) or lists (positional)
            if isinstance(lnk, dict):
                lid = lnk["id"]
                oid = lnk["origin_id"]
                oslot = lnk["origin_slot"]
                tid = lnk["target_id"]
            else:
                lid, oid, oslot, tid = lnk[0], lnk[1], lnk[2], lnk[3]
            if oid == -10:
                from_input_node[lid] = oslot
            elif tid == -20:
                to_output_node[lid] = (oid, oslot)
            else:
                inner_link_map[lid] = (oid, oslot)

        # -- Convert each inner node --
        for inode in sg_nodes:
            iid = inode["id"]
            itype = inode.get("type", "")
            inputs_def = inode.get("inputs", [])
            wv = inode.get("widgets_values", [])

            api_inputs: dict[str, Any] = {}

            # Widget values
            if isinstance(wv, dict):
                for k, v in wv.items():
                    api_inputs[k] = v
            elif isinstance(wv, (list, tuple)):
                wi = 0
                for inp in inputs_def:
                    if "widget" in inp:
                        if wi < len(wv) and wv[wi] is not None:
                            api_inputs[inp["widget"]["name"]] = wv[wi]
                        wi += 1
                        # Skip phantom control_after_generate after seed widgets
                        if inp["widget"]["name"] == "seed" and wi < len(wv):
                            wi += 1

            # Direct widget overrides from proxyWidgets
            if iid in direct_overrides:
                for wname, wval in direct_overrides[iid].items():
                    if wval is not None:
                        api_inputs[wname] = wval

            # Resolve inner links
            for inp in inputs_def:
                lid = inp.get("link")
                if lid is None:
                    continue
                if lid in inner_link_map:
                    oid, oslot = inner_link_map[lid]
                    api_inputs[inp["name"]] = [f"{prefix}{oid}", oslot]
                elif lid in from_input_node:
                    slot = from_input_node[lid]
                    if slot in input_slot_values:
                        api_inputs[inp["name"]] = input_slot_values[slot]

            api[f"{prefix}{iid}"] = {"class_type": itype, "inputs": api_inputs}

        # -- Register output remaps --
        for lid, (inner_oid, inner_oslot) in to_output_node.items():
            for out_idx, sg_out in enumerate(sg_outputs):
                if lid in sg_out.get("linkIds", []):
                    output_remap[(str(outer_id), out_idx)] = (
                        f"{prefix}{inner_oid}", inner_oslot,
                    )
                    break

    # -- Wan 2.2 Video Generation (ComfyUI) --------------------------------

    def generate_video_clip(self, prompt: str, seed: int | None = None,
                            prefix: str = "MoolahIQ") -> str | None:
        """Generate a ~5-second video clip via ComfyUI.

        Loads the workflow from COMFYUI_WORKFLOW_PATH env var (a JSON file).
        Falls back to the built-in WAN22_T2V_WORKFLOW with a warning if the
        file is not found.

        Injection rules for the loaded workflow:
          - Prompt: injected into the first CLIPTextEncode node whose _meta
            title contains "positive" (case-insensitive).
          - Seed: injected into every node that has a noise_seed or seed input.
          - Prefix: injected into SaveVideo / VHS_VideoCombine nodes'
            filename_prefix input.

        Args:
            prompt: Visual description for the video scene.
            seed: Noise seed for reproducibility. Random if None.
            prefix: Filename prefix for the saved video.

        Returns:
            Path to the downloaded MP4 file, or None on failure.
        """
        import json as _json

        workflow_path = os.getenv("COMFYUI_WORKFLOW_PATH", "")
        if workflow_path and Path(workflow_path).is_file():
            with open(workflow_path, "r", encoding="utf-8") as fh:
                workflow = _json.load(fh)
            log.info("[%s] Loaded ComfyUI workflow from %s", self.name, workflow_path)
        else:
            if workflow_path:
                log.warning(
                    "[%s] COMFYUI_WORKFLOW_PATH=%s not found — falling back to "
                    "built-in WAN22_T2V_WORKFLOW", self.name, workflow_path,
                )
            workflow = copy.deepcopy(WAN22_T2V_WORKFLOW)

        # Convert UI-format (canvas export) to API-format if needed
        workflow = self._convert_ui_to_api(workflow)

        effective_seed = seed if seed is not None else random.randint(0, 2**53)

        # Inject prompt, seed, and prefix into the workflow nodes
        #
        # Injection strategy (prompt):
        #   1. ALL CLIPTextEncode nodes with "text" input get the prompt
        #      (these are content-description encoders).
        #   2. ALL WanVideoTextEncode* nodes with "positive_prompt" input
        #      get the prompt (these are motion/style encoders that also
        #      accept scene descriptions).
        #   This ensures BOTH the content encoder (e.g. sg25_27) AND the
        #   motion encoder (e.g. node 19) receive the visual prompt.
        #   UI-exported workflows lose _meta.title during conversion, so
        #   we cannot rely on "positive" in the title.
        #
        # Injection strategy (prefix):
        #   SaveVideo, VHS_VideoCombine, AND SaveImage nodes all get the
        #   directive clip name as filename_prefix.
        prompt_injected = False
        save_node_id = None
        for node_id, node in workflow.items():
            if not isinstance(node, dict):
                continue
            nid = node_id
            inputs = node.get("inputs", {})
            class_type = node.get("class_type", "")

            # Prompt -> ALL text encoder nodes (content + motion)
            if "CLIPTextEncode" in class_type:
                if "text" in inputs and isinstance(inputs["text"], str):
                    inputs["text"] = prompt
                    prompt_injected = True
            if "WanVideoTextEncode" in class_type:
                if "positive_prompt" in inputs and isinstance(inputs["positive_prompt"], str):
                    inputs["positive_prompt"] = prompt
                    prompt_injected = True

            # Seed -> any node with noise_seed or seed input
            if "noise_seed" in inputs:
                inputs["noise_seed"] = effective_seed
            if "seed" in inputs:
                inputs["seed"] = effective_seed

            # Prefix -> SaveVideo, VHS_VideoCombine, AND SaveImage
            if class_type in ("SaveVideo", "VHS_VideoCombine", "SaveImage"):
                save_node_id = nid
                if "filename_prefix" in inputs:
                    inputs["filename_prefix"] = f"video/{prefix}"

        if not prompt_injected:
            log.warning("[%s] No prompt node found in workflow — visual prompt was not injected",
                        self.name)

        # Log the prompt being sent for diagnostics
        log.info("[%s] ComfyUI submit — prefix=%s prompt=%s",
                 self.name, prefix, prompt[:120])

        # Submit to ComfyUI
        payload = {"prompt": workflow}
        try:
            resp = httpx.post(f"{COMFYUI_URL}/prompt", json=payload, timeout=30)
            resp.raise_for_status()
            prompt_id = resp.json().get("prompt_id")
            if not prompt_id:
                log.warning("[%s] ComfyUI returned no prompt_id", self.name)
                return None
            log.info("[%s] ComfyUI prompt submitted: %s", self.name, prompt_id)
        except httpx.ConnectError:
            log.warning("[%s] ComfyUI not reachable at %s", self.name, COMFYUI_URL)
            return None
        except Exception as exc:
            log.warning("[%s] ComfyUI prompt submission failed: %s", self.name, exc)
            return None

        # Poll for completion
        output_info = self._poll_comfyui(prompt_id, save_node_id=save_node_id)
        if not output_info:
            return None

        # Download the video file
        return self._download_comfyui_file(
            output_info["filename"],
            output_info.get("subfolder", ""),
            label=f"clip_{prefix}",
        )

    def _poll_comfyui(self, prompt_id: str, max_wait: int = 600,
                      poll_interval: int = 7,
                      save_node_id: str | None = None) -> dict | None:
        """Poll ComfyUI /history until the prompt completes.

        Args:
            prompt_id: The ComfyUI prompt ID to poll.
            max_wait: Maximum seconds to wait before timing out.
            poll_interval: Seconds between poll requests.
            save_node_id: Node ID of the SaveVideo/VHS_VideoCombine node.
                If None, auto-detect from outputs.

        Returns:
            Dict with {filename, subfolder, type} for the output video,
            or None on timeout/error.
        """
        deadline = time.time() + max_wait

        while time.time() < deadline:
            try:
                resp = httpx.get(f"{COMFYUI_URL}/history/{prompt_id}", timeout=10)
                resp.raise_for_status()
                data = resp.json()
            except Exception as exc:
                log.debug("[%s] ComfyUI poll error: %s", self.name, exc)
                time.sleep(poll_interval)
                continue

            if prompt_id not in data:
                time.sleep(poll_interval)
                continue

            entry = data[prompt_id]

            # Check for errors in status
            status_info = entry.get("status", {})
            if status_info.get("status_str") == "error":
                msgs = status_info.get("messages", [])
                log.warning("[%s] ComfyUI prompt FAILED: %s", self.name, msgs)
                return None

            # Check completed flag
            if not status_info.get("completed", False):
                time.sleep(poll_interval)
                continue

            outputs = entry.get("outputs", {})

            # Auto-detect save node if not specified
            if save_node_id and save_node_id in outputs:
                node_output = outputs[save_node_id]
            else:
                # Find first node with video/gif output
                node_output = None
                for nid, nout in outputs.items():
                    if nout.get("gifs") or nout.get("videos"):
                        node_output = nout
                        log.info("[%s] Auto-detected video output on node %s", self.name, nid)
                        break
                if node_output is None:
                    log.warning("[%s] ComfyUI completed but no video output found in nodes: %s",
                                self.name, list(outputs.keys()))
                    return None
            # SaveVideo outputs under "images" (with animated flag), "videos", or "gifs"
            videos = (node_output.get("videos")
                      or node_output.get("gifs")
                      or node_output.get("images", []))
            if not videos:
                log.warning("[%s] ComfyUI completed but output node has no video files: %s",
                            self.name, list(node_output.keys()))
                return None

            video_info = videos[0]
            log.info("[%s] ComfyUI video ready: %s (subfolder=%s)",
                     self.name, video_info["filename"],
                     video_info.get("subfolder", ""))
            return video_info

        log.warning("[%s] ComfyUI polling timed out after %ds for prompt %s",
                    self.name, max_wait, prompt_id)
        return None

    def _download_comfyui_file(self, filename: str, subfolder: str = "",
                               label: str = "file") -> str | None:
        """Download a file from ComfyUI's output directory and validate it.

        Args:
            filename: The output filename from ComfyUI history.
            subfolder: Subfolder within ComfyUI's output directory.
            label: Label for logging.

        Returns:
            Local file path, or None on failure/invalid video.
        """
        params: dict[str, str] = {"filename": filename, "type": "output"}
        if subfolder:
            params["subfolder"] = subfolder

        try:
            resp = httpx.get(f"{COMFYUI_URL}/view", params=params, timeout=120)
            resp.raise_for_status()
        except Exception as exc:
            log.warning("[%s] Failed to download %s from ComfyUI: %s", self.name, label, exc)
            return None

        if len(resp.content) < 10_000:
            log.warning("[%s] Downloaded %s is too small (%d bytes) -- likely empty/corrupt",
                        self.name, label, len(resp.content))
            return None

        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        out_path = OUTPUT_DIR / filename.split("/")[-1]
        out_path.write_bytes(resp.content)
        log.info("[%s] Downloaded %s -> %s (%d bytes)",
                 self.name, label, out_path, len(resp.content))

        # Validate the video has actual frames
        try:
            from moviepy import VideoFileClip
            clip = VideoFileClip(str(out_path))
            duration = clip.duration
            w, h = clip.w, clip.h
            # Check first frame isn't all black
            frame = clip.get_frame(0)
            mean_px = float(frame.mean())
            clip.close()

            if duration < 0.5:
                log.warning("[%s] %s has no real duration (%.1fs) -- discarding",
                            self.name, label, duration)
                out_path.unlink(missing_ok=True)
                return None

            if mean_px < 5.0:
                log.warning("[%s] %s appears to be all black (mean_px=%.1f) -- discarding",
                            self.name, label, mean_px)
                out_path.unlink(missing_ok=True)
                return None

            log.info("[%s] Validated %s: %dx%d, %.1fs, mean_px=%.1f",
                     self.name, label, w, h, duration, mean_px)
        except Exception as exc:
            log.warning("[%s] %s failed video validation: %s -- keeping file anyway",
                        self.name, label, exc)

        return str(out_path)

    # -- Script parsing & visual prompts -----------------------------------

    # Canonical section aliases — maps variant markers to standard names
    _SECTION_ALIASES: dict[str, str] = {
        "ANCHOR": "INTRO",
        "CHANNEL": "INTRO",
        "BODY": "MAIN",
        "CONTENT": "MAIN",
        "CONCLUSION": "CTA",
        "OUTRO": "CTA",
    }

    @staticmethod
    def _extract_script_body(script_text: str) -> str:
        """Strip ===SCRIPT_START=== / ===SCRIPT_END=== delimiters if present."""
        text = script_text
        text = re.sub(r"===\s*SCRIPT_START\s*===", "", text)
        text = re.sub(r"===\s*SCRIPT_END\s*===", "", text)
        return text.strip()

    @classmethod
    def _parse_script_sections(cls, script_text: str) -> list[dict[str, str]]:
        """Extract [SECTION] blocks from a script using flexible markers.

        Recognises markers like [HOOK], [INTRO], [MAIN BODY], [CTA], etc.
        The *last word* of the marker text is treated as the canonical name
        (e.g. [MAIN BODY] -> BODY -> aliased to MAIN).

        Returns:
            List of {"section": "<CANONICAL>", "text": "..."} dicts.
        """
        pattern = r"\[([^\]]+)\]\s*\n(.*?)(?=\n\[[^\]]+\]|\Z)"
        matches = re.findall(pattern, script_text, re.DOTALL)

        sections: list[dict[str, str]] = []
        for raw_name, text in matches:
            # Canonical name = last word of marker, upper-cased
            canonical = raw_name.strip().split()[-1].upper()
            canonical = cls._SECTION_ALIASES.get(canonical, canonical)
            cleaned = text.strip()
            if cleaned:
                sections.append({"section": canonical, "text": cleaned})
        return sections

    @staticmethod
    def _chunk_section_into_clips(text: str, max_sentences: int = 2) -> list[str]:
        """Split section text into 1-2 sentence chunks for per-sentence clips.

        Directive V3.8.8.4: each video clip = 1-2 sentences max.
        Target: 96-144 clips per full video.

        Short sentences (< 4 words) are merged with the next sentence so
        that trivially short clips are avoided.
        """
        sentences = re.split(r"(?<=[.!?])\s+", text.strip())
        # Filter out empty strings from split
        sentences = [s for s in sentences if s.strip()]

        chunks: list[str] = []
        buf: list[str] = []

        for sent in sentences:
            buf.append(sent)
            # Merge short sentences (< 4 words) with the next one
            if len(sent.split()) < 4 and len(buf) < max_sentences:
                continue
            if len(buf) >= max_sentences:
                chunks.append(" ".join(buf))
                buf = []

        if buf:
            chunks.append(" ".join(buf))
        return chunks

    def _parse_script_scenes(self, script_text: str) -> list[dict[str, str]]:
        """Full pipeline: strip delimiters -> parse sections -> chunk into clips.

        Returns flat list of {"section": "<CANONICAL>", "text": "chunk..."}.
        Logs an error and returns [] if total chunks < 80.
        """
        body = self._extract_script_body(script_text)
        sections = self._parse_script_sections(body)

        if not sections:
            # Fallback: treat entire body as one MAIN section
            sections = [{"section": "MAIN", "text": body}]

        chunks: list[dict[str, str]] = []
        for sec in sections:
            for chunk_text in self._chunk_section_into_clips(sec["text"]):
                chunks.append({"section": sec["section"], "text": chunk_text})

        # TODO: raise back to 80 once ContentAgent consistently produces 160+ sentences
        if len(chunks) < 40:
            log.error(
                "[%s] Script produced only %d chunks (minimum 40 required) — "
                "halting video generation. Check script format markers.",
                self.name, len(chunks),
            )
            return []

        return chunks

    # -- Narration-to-scene keyword map ------------------------------------
    # Maps financial keywords in chunk narration to visually distinct scene
    # descriptions.  Checked in order; first match wins.  This keeps prompt
    # generation fast (no API call per chunk) while ensuring each clip's
    # visual reflects what is actually being said in the narration.
    _SCENE_KEYWORDS: list[tuple[list[str], str]] = [
        # Markets & trading
        (["stock", "market", "trading", "wall street", "dow", "s&p", "nasdaq"],
         "financial trading floor with multiple monitors showing live market data, green and red charts"),
        (["interest rate", "fed", "federal reserve", "monetary policy", "rate hike", "rate cut"],
         "Federal Reserve building exterior, serious news broadcast style, economic data overlay"),
        (["inflation", "prices", "cost of living", "cpi", "consumer price"],
         "grocery store aisle with price tags, everyday items, shopping perspective"),
        # Housing (before credit card — "mortgage payment" should match here, not credit)
        (["mortgage", "home", "house", "property", "real estate", "rent", "homeowner"],
         "beautiful suburban home exterior with for-sale sign, golden hour lighting"),
        # Banking & savings
        (["bank", "savings", "emergency fund", "high-yield", "apy", "deposit"],
         "modern bank interior with warm lighting, person reviewing savings account on phone"),
        (["credit card", "debt", "balance", "apr", "minimum payment"],
         "close-up of credit cards on a desk next to a calculator and bills, overhead shot"),
        # Investing
        (["invest", "portfolio", "diversif", "asset", "allocation"],
         "professional investment advisor office with charts on wall, portfolio review meeting"),
        (["compound", "growth", "long-term", "retirement", "401k", "ira"],
         "time-lapse style growth visualization, seedling growing into tree, wealth building metaphor"),
        (["crypto", "bitcoin", "blockchain", "digital currency"],
         "futuristic digital finance visualization, blockchain nodes, modern tech office"),
        # Insurance & protection
        (["insurance", "coverage", "policy", "premium", "deductible", "claim"],
         "insurance agent office, person reviewing policy documents, professional setting"),
        (["protect", "safety net", "risk", "disaster", "emergency"],
         "family in comfortable living room looking at documents together, warm safe atmosphere"),
        # Budgeting & planning
        (["budget", "spending", "expense", "track", "plan"],
         "person at clean desk with laptop showing budget spreadsheet, organized workspace, coffee cup"),
        (["tax", "irs", "deduction", "refund", "filing"],
         "tax preparation office, organized documents, calculator, professional tax advisor"),
        (["income", "salary", "earn", "paycheck", "raise", "negotiate"],
         "confident professional in modern office, career growth setting, city skyline through window"),
        # Education & action
        (["step", "action", "strategy", "tip", "how to", "guide"],
         "person writing numbered list in notebook, focused planning session, motivational setting"),
        (["mistake", "wrong", "avoid", "warning", "careful", "trap"],
         "person at crossroads, cautionary scene, dramatic lighting, decision moment"),
        (["success", "achieve", "goal", "result", "transform"],
         "person celebrating at desk, achievement moment, positive energy, bright office"),
        # Emotional / story beats
        (["story", "family", "remember", "happened", "told me", "experience"],
         "warm storytelling scene, person in comfortable chair, soft lighting, narrative moment"),
        (["stress", "worried", "anxious", "overwhelm", "struggle"],
         "person looking concerned at laptop screen, dim lighting, empathetic mood"),
        (["relief", "peace", "calm", "freedom", "control"],
         "person relaxing confidently, sunny window, organized space, sense of accomplishment"),
    ]

    @classmethod
    def _narration_to_scene(cls, narration: str) -> str | None:
        """Match narration text to a scene description via keyword lookup.

        Returns the first matching scene description, or None if no keywords
        match (caller falls back to subject-rotation default).
        """
        lower = narration.lower()
        for keywords, scene in cls._SCENE_KEYWORDS:
            if any(kw in lower for kw in keywords):
                return scene
        return None

    @staticmethod
    def _scene_to_visual_prompt(
        section: str,
        narration: str,
        topic: str,
        *,
        chunk_index: int = 0,
        total_chunks: int = 1,
        pillar: str = "GENERAL",
    ) -> str:
        """Build a visual prompt from the chunk's narration content.

        Three-tier prompt generation:
          1. Keyword match: scan narration for financial concepts and map to
             a visually distinct scene (fast, no API call).
          2. Subject rotation (fallback): if no keyword matches, rotate
             between POV hands / group / single-subject shots.
          3. Section tone: overlay section-specific energy on every prompt.

        Subject rotation (by chunk_index):
          - Every 10th chunk (idx % 10 == 9): POV hands shot
          - Every 5th chunk  (idx % 5 == 4):  couple / group shot
          - Otherwise:                         single subject

        Gender for single-subject clips: 60 % women / 40 % men
        (female if single_clip_idx % 5 < 3, else male).
        """
        tone_map = {
            "HOOK": "energetic, speaking directly to camera, confident hand gestures",
            "INTRO": "warm and welcoming, friendly expression, casual setting",
            "MAIN": "focused, explaining concepts, educational tone",
            "CTA": "inviting, positive expression, call-to-action energy",
        }
        tone = tone_map.get(section, "professional, natural gestures")

        # ── Tier 1: narration-driven scene (content-aware) ────────────────
        scene = ProductionAgent._narration_to_scene(narration)
        if scene:
            subject = f"{scene}, {tone}"
        # ── Tier 2: subject rotation (fallback for generic narration) ─────
        elif chunk_index % 10 == 9:
            subject = (
                "Close-up POV shot of hands working on a laptop or writing notes, "
                "clean desk, modern workspace"
            )
        elif chunk_index % 5 == 4:
            subject = (
                "Two people having a conversation about finances, diverse pair, "
                "modern living room or café setting"
            )
        else:
            single_idx = sum(
                1 for ci in range(chunk_index)
                if ci % 10 != 9 and ci % 5 != 4
            )
            gender = "female" if single_idx % 5 < 3 else "male"
            age_desc = "young adult (18-23)" if single_idx % 2 == 0 else "young professional (24-34)"
            subject = (
                f"Single {gender} {age_desc} person, {tone}, "
                f"modern setting related to {topic}"
            )

        suffix = (
            ", cinematic quality, professional lighting, smooth camera motion, "
            "4K detail, shallow depth of field, no text no watermark"
        )
        return f"{subject}, {suffix}"

    # -- Per-section TTS (edge-tts) ----------------------------------------

    # -- Qwen3-TTS voice configuration (MoolahIQ brand voices) -----------
    #
    # Qwen3-TTS runs in a separate conda env (qwen3-tts) and is invoked
    # as a subprocess via qwenTTS.py.  No HTTP server required.
    #
    # Brand voices:
    #   Aiden  — main narration (deep, authoritative, 140 WPM target)
    #   Vivian — hooks / intros (warm Alto, 140 WPM target)

    # Section types that use Vivian (female) voice for hooks / intros
    _VIVIAN_SECTIONS = frozenset({"HOOK", "INTRO", "ANCHOR", "CHANNEL"})

    _AIDEN_STYLE = (
        "Speak in a deep, low register with warm, rich chest resonance. "
        "Deliver with calm authority and measured precision, like a seasoned "
        "financial analyst briefing a private client. Grounded and confident "
        "with intellectual curiosity. Every sentence ending falls downward. "
        "Smooth, articulate, trust-commanding. Studio-clean, natural pacing. "
        "Deep chest-forward resonance, deliberate structured pacing."
    )
    _VIVIAN_STYLE = (
        "Speak very slowly and deliberately in a low, warm Alto register with deep chest "
        "resonance. Rich, full-bodied voice. Deliver with calm authority and measured "
        "precision, like a senior investment strategist giving a private briefing. "
        "Warm but never sentimental. Every sentence ending falls downward, never rises. "
        "Smooth, articulate, trust-commanding. Take your time between phrases. "
        "Lower pitch, chest-forward resonance, slow structured pacing."
    )

    # Paths — override via env vars if needed
    _QWEN3_PYTHON = os.getenv(
        "QWEN3_TTS_PYTHON",
        r"C:\Users\User\anaconda3\envs\qwen3-tts\python.exe",
    )
    _QWEN3_SCRIPT = os.getenv(
        "QWEN3_TTS_SCRIPT",
        r"D:\Input\qwen3-tts\qwenTTS.py",
    )

    def _generate_section_tts(self, text: str, output_path: str,
                              section: str = "") -> bool:
        """Generate TTS audio for a single script section via Qwen3-TTS.

        Calls qwenTTS.py as a subprocess in the qwen3-tts conda env.
        The model is loaded once per subprocess; for multi-section pipelines
        the model stays warm in GPU memory across calls.

        Brand voices:
          - Aiden: main narration (PROBLEM, STORY, SOLUTION, CTA, OUTRO, etc.)
            Speed: -0.32 (0.68x multiplier → ~140 WPM)
          - Vivian: hooks and intros (HOOK, INTRO, ANCHOR, CHANNEL)
            Speed: -0.28 (0.72x multiplier → ~140 WPM)

        Post-processing (speed stretch, EQ, pitch) is handled by a dedicated
        wrapper script that mirrors generate_aiden_final.py / generate_vivian_v3.py.
        For the subprocess path we pass --speed to qwenTTS.py which applies
        scipy.signal.resample internally.

        Args:
            text: Narration text for this section.
            output_path: Where to save the audio file (.mp3).
            section: Section type (HOOK, INTRO, etc.) to select voice.

        Returns:
            True if audio was saved successfully, False on failure.
        """
        import subprocess
        import tempfile

        # Select voice based on section
        use_vivian = section.upper() in self._VIVIAN_SECTIONS
        speaker = "Vivian" if use_vivian else "Aiden"
        style = self._VIVIAN_STYLE if use_vivian else self._AIDEN_STYLE
        speed = "-0.28" if use_vivian else "-0.32"  # relative: -0.32 -> 0.68x

        log.info("[%s] Qwen3-TTS: speaker=%s, section=%s, speed=%s, %d words",
                 self.name, speaker, section or "UNKNOWN", speed, len(text.split()))

        out = Path(output_path)
        out.parent.mkdir(parents=True, exist_ok=True)

        # Write text to a temp file (qwenTTS.py reads from --input file)
        try:
            tmp = tempfile.NamedTemporaryFile(
                mode="w", suffix=".txt", delete=False, encoding="utf-8",
            )
            tmp.write(text)
            tmp.close()
            tmp_path = tmp.name
        except Exception as exc:
            log.warning("[%s] Failed to write TTS temp file: %s", self.name, exc)
            return False

        cmd = [
            self._QWEN3_PYTHON,
            self._QWEN3_SCRIPT,
            "--input", tmp_path,
            "--output", str(out),
            "--speaker", speaker,
            "--style", style,
            "--speed", speed,
        ]

        try:
            log.info("[%s] Running: %s %s --speaker %s --speed %s -> %s",
                     self.name, Path(self._QWEN3_PYTHON).name,
                     Path(self._QWEN3_SCRIPT).name, speaker, speed, out.name)

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300,  # 5 min max per section
                cwd=str(Path(self._QWEN3_SCRIPT).parent),
            )

            if result.returncode != 0:
                log.warning("[%s] Qwen3-TTS failed (exit %d):\n%s",
                            self.name, result.returncode,
                            (result.stderr or result.stdout)[:500])
                return False

            if not out.exists() or out.stat().st_size < 1000:
                log.warning("[%s] Qwen3-TTS output missing or too small: %s", self.name, out)
                return False

            log.info("[%s] Qwen3-TTS saved -> %s (%d bytes)",
                     self.name, out, out.stat().st_size)
            return True

        except subprocess.TimeoutExpired:
            log.warning("[%s] Qwen3-TTS timed out after 300s for section %s",
                        self.name, section)
            return False
        except FileNotFoundError:
            log.error("[%s] Qwen3-TTS python not found at %s. "
                      "Set QWEN3_TTS_PYTHON env var to the correct path.",
                      self.name, self._QWEN3_PYTHON)
            return False
        except Exception as exc:
            log.warning("[%s] Qwen3-TTS subprocess error: %s", self.name, exc)
            return False
        finally:
            try:
                os.unlink(tmp_path)
            except OSError:
                pass

    # -- Full video pipeline -----------------------------------------------

    # -- Directive V3.8.8.4 naming helpers -----------------------------------

    # Section -> category keyword for clip filenames
    _SECTION_CATEGORY = {
        "HOOK": "HOOK",
        "INTRO": "INTRO",
        "MAIN": "BODY",
        "CTA": "CTA",
        "ANCHOR": "ANCHOR",
        "CHANNEL": "CHANNEL",
    }

    @staticmethod
    def _topic_to_descriptor(topic: str) -> str:
        """Derive a short descriptor slug from the topic string.

        Takes the first two meaningful words, lowercased, joined by hyphen.
        Falls back to 'general' if topic is empty.
        """
        stop = {"the", "a", "an", "of", "to", "in", "for", "and", "on", "your", "how", "with"}
        words = [w.lower() for w in re.sub(r"[^a-zA-Z0-9\s]", "", topic).split()
                 if w.lower() not in stop]
        return "-".join(words[:2]) if words else "general"

    @staticmethod
    def _age_code_for_chunk(chunk_index: int) -> str:
        """Rotate age demographic code across clips.

        Cycles: 25 -> 30 -> 35 -> 22 (mirrors the subject-selection age
        rotation already in _scene_to_visual_prompt).
        """
        ages = ["25", "30", "35", "22"]
        return ages[chunk_index % len(ages)]

    @staticmethod
    def _culture_code_for_chunk(chunk_index: int) -> str:
        """Rotate culture/setting code across clips."""
        codes = ["urban", "suburban", "metro", "coastal"]
        return codes[chunk_index % len(codes)]

    def _clip_name(self, pillar: str, section: str, topic: str,
                   chunk_index: int) -> str:
        """Build directive V3.8.8.4 clip filename prefix.

        Format: PILLAR-CATEGORY-DESCRIPTOR-AGE-CULTURE-SCENE-ID
        Example: INVEST-CHART-growth-35-urban-001
        """
        category = self._SECTION_CATEGORY.get(section, section)
        descriptor = self._topic_to_descriptor(topic)
        age = self._age_code_for_chunk(chunk_index)
        culture = self._culture_code_for_chunk(chunk_index)
        scene_id = f"{chunk_index + 1:03d}"
        return f"{pillar}-{category}-{descriptor}-{age}-{culture}-{scene_id}"

    def generate_video(self, state: PipelineState) -> str | None:
        """Full video generation pipeline: sentence-level clips + TTS + MoviePy.

        Directive V3.8.8.4 — sentence-level chunking:
          - Each clip = 1-2 sentences of narration.
          - Target: 96-144 clips per full video.
          - Naming: PILLAR-CATEGORY-DESCRIPTOR-AGE-CULTURE-SCENE-ID.mp4

        For each sentence chunk:
          1. Generate a visual prompt from the section type and topic.
          2. Generate a ~5s Wan 2.2 video clip via ComfyUI.
          3. Generate TTS audio for the narration.
          4. Loop the clip to match audio duration.

        Then concatenate all chunks with crossfade transitions and export.

        Returns:
            Path to the final assembled MP4, or None on failure.
        """
        script = state.get("script", "")
        if not script:
            log.warning("[%s] No script in state -- video generation skipped", self.name)
            return None

        topic = state.get("topic", "personal finance")
        pillar = state.get("pillar", "GENERAL").upper()
        chunks = self._parse_script_scenes(script)
        total_chunks = len(chunks)
        log.info("[%s] Parsed %d sentence-level chunks (target 96-144)",
                 self.name, total_chunks)

        if not chunks:
            log.warning("[%s] No chunks produced (script too short or bad format)", self.name)
            return None

        # Generate clips and audio for each sentence chunk
        chunk_assets: list[dict[str, str | None]] = []

        for i, chunk in enumerate(chunks):
            section = chunk["section"]
            narration = chunk["text"]
            clip_name = self._clip_name(pillar, section, topic, i)
            log.info("[%s] Chunk %d/%d [%s] %s (%d words)",
                     self.name, i + 1, total_chunks, section, clip_name,
                     len(narration.split()))

            # Generate visual prompt with subject selection
            visual_prompt = self._scene_to_visual_prompt(
                section, narration, topic,
                chunk_index=i, total_chunks=total_chunks, pillar=pillar,
            )

            # Generate Wan 2.2 clip via ComfyUI
            clip_path = self.generate_video_clip(
                visual_prompt,
                seed=random.randint(0, 2**53),
                prefix=clip_name,
            )

            # Generate TTS audio for this chunk (Qwen3-TTS brand voices)
            tts_path = str(OUTPUT_DIR_TTS / f"{clip_name}.mp3")
            tts_ok = self._generate_section_tts(narration, tts_path, section=section)

            chunk_assets.append({
                "section": section,
                "clip": clip_path,
                "tts": tts_path if tts_ok else None,
            })

        # Filter to chunks that have at least a video clip
        valid = [a for a in chunk_assets if a["clip"]]
        if not valid:
            log.warning("[%s] No video clips generated -- assembly skipped", self.name)
            return None

        log.info("[%s] Assembling %d sections into final video", self.name, len(valid))

        # MoviePy assembly
        try:
            from moviepy import (
                AudioFileClip,
                VideoFileClip,
                concatenate_videoclips,
                vfx,
            )
        except ImportError:
            log.warning("[%s] moviepy not installed -- video assembly skipped", self.name)
            return None

        clips = []
        for asset in valid:
            video = VideoFileClip(asset["clip"])

            if asset["tts"] and Path(asset["tts"]).exists():
                audio = AudioFileClip(asset["tts"])
                # Loop the ~5s clip to match TTS audio duration
                if video.duration < audio.duration:
                    video = video.with_effects([vfx.Loop(duration=audio.duration)])
                else:
                    video = video.subclipped(0, audio.duration)
                video = video.with_audio(audio)

            # Apply crossfade on non-first clips
            if clips:
                video = video.with_effects([vfx.CrossFadeIn(1.0)])

            clips.append(video)

        if not clips:
            return None

        # Fade from black on first, fade to black on last
        clips[0] = clips[0].with_effects([vfx.FadeIn(1.0)])
        clips[-1] = clips[-1].with_effects([vfx.FadeOut(1.0)])

        # Concatenate with 1-second overlap for crossfade transitions
        if len(clips) > 1:
            final = concatenate_videoclips(clips, method="compose", padding=-1)
        else:
            final = clips[0]

        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        out_path = str(OUTPUT_DIR / f"final_{uuid.uuid4().hex[:8]}.mp4")

        final.write_videofile(
            out_path,
            fps=30,
            codec="libx264",
            audio_codec="aac",
            audio_bitrate="192k",
            preset="medium",
            threads=4,
        )

        # Cleanup moviepy clips
        for c in clips:
            try:
                c.close()
            except Exception:
                pass
        try:
            final.close()
        except Exception:
            pass

        log.info("[%s] Final video assembled -> %s", self.name, out_path)
        return out_path

    # -- YouTube upload ----------------------------------------------------

    def _upload_to_youtube(self, video_path: str, state: PipelineState,
                           thumbnail_path: str | None = None) -> str | None:
        """Upload the final video to YouTube as private.

        Uses OAuth2 credentials from credentials.json / token.json at
        project root, or YOUTUBE_CLIENT_ID/SECRET from environment.

        Returns:
            YouTube video ID, or None on failure.
        """
        try:
            from google.oauth2.credentials import Credentials
            from google_auth_oauthlib.flow import InstalledAppFlow
            from google.auth.transport.requests import Request
            from googleapiclient.discovery import build
            from googleapiclient.http import MediaFileUpload
        except ImportError:
            log.warning("[%s] google-api-python-client not installed -- YouTube upload skipped",
                        self.name)
            return None

        SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]
        creds = None
        token_path = Path("token.json")

        # Try loading existing token
        if token_path.exists():
            creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)

        if not creds or not creds.valid:
            if creds and creds.expired and creds.refresh_token:
                creds.refresh(Request())
            else:
                creds_path = Path("credentials.json")
                if creds_path.exists():
                    flow = InstalledAppFlow.from_client_secrets_file(str(creds_path), SCOPES)
                    creds = flow.run_local_server(port=0)
                else:
                    client_id = os.getenv("YOUTUBE_CLIENT_ID")
                    client_secret = os.getenv("YOUTUBE_CLIENT_SECRET")
                    if not client_id or not client_secret:
                        log.warning("[%s] No YouTube credentials available -- upload skipped",
                                    self.name)
                        return None
                    client_config = {
                        "installed": {
                            "client_id": client_id,
                            "client_secret": client_secret,
                            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                            "token_uri": "https://oauth2.googleapis.com/token",
                            "redirect_uris": ["http://localhost"],
                        }
                    }
                    flow = InstalledAppFlow.from_client_config(client_config, SCOPES)
                    creds = flow.run_local_server(port=0)

            token_path.write_text(creds.to_json())

        youtube = build("youtube", "v3", credentials=creds)

        metadata = state.get("metadata", {})
        title = metadata.get("title", state.get("topic", "Moolah IQ Video"))[:100]
        description = metadata.get("description", "")
        tags = metadata.get("tags", [])[:30]

        description_full = (
            f"{description}\n\n"
            "---\n"
            "Disclaimer: This video is for informational and educational purposes only. "
            "It is not financial advice. Always do your own research before making "
            "investment decisions.\n\n"
            "Generated by Moolah IQ"
        )[:5000]

        body = {
            "snippet": {
                "title": title,
                "description": description_full,
                "tags": tags,
                "categoryId": "22",
                "defaultLanguage": "en",
            },
            "status": {
                "privacyStatus": "private",
                "selfDeclaredMadeForKids": False,
            },
        }

        log.info("[%s] Uploading to YouTube: %s", self.name, title)

        try:
            media = MediaFileUpload(video_path, chunksize=-1, resumable=True,
                                    mimetype="video/mp4")
            request = youtube.videos().insert(
                part="snippet,status", body=body, media_body=media,
            )

            response = None
            while response is None:
                status, response = request.next_chunk()
                if status:
                    log.info("[%s] Upload progress: %d%%",
                             self.name, int(status.progress() * 100))

            video_id = response["id"]
            log.info("[%s] YouTube upload complete: %s", self.name, video_id)

            # Set thumbnail if provided
            if thumbnail_path and Path(thumbnail_path).exists():
                try:
                    youtube.thumbnails().set(
                        videoId=video_id,
                        media_body=MediaFileUpload(thumbnail_path, mimetype="image/png"),
                    ).execute()
                    log.info("[%s] YouTube thumbnail set for %s", self.name, video_id)
                except Exception as exc:
                    log.warning("[%s] Failed to set YouTube thumbnail: %s", self.name, exc)

            return video_id

        except Exception as exc:
            log.warning("[%s] YouTube upload failed: %s", self.name, exc)
            return None

    # -- Mock mode ---------------------------------------------------------

    def _mock_run(self, state: PipelineState) -> PipelineState:
        """Return realistic mock production data for dry-run testing."""
        log.info("[%s] MOCK MODE -- returning stub production assets", self.name)
        state["visuals"] = {
            "thumbnail": "output/thumbnails/mock_emergency_fund_thumb_1280x720.png",
            "broll": [
                "output/broll/mock_calculator_scene_5s.webm",
                "output/broll/mock_piggybank_scene_5s.webm",
                "output/broll/mock_family_scene_5s.webm",
            ],
            "lower_thirds": ["output/lower_thirds/mock_stat_overlay_01.png"],
        }
        state["audio"] = {
            "tts": "output/audio/mock_tts_final.wav",
            "music_bed": "output/audio/mock_ambient_track.wav",
            "final_mix": "output/audio/mock_final_mix.wav",
            "duration_seconds": 620,
            "wpm": 155,
        }
        state["video_path"] = "output/video/mock_final_1080p.mp4"
        state["youtube_id"] = "mock_dQw4w9WgXcQ"
        state.setdefault("metadata", {})["synthetic_content_flag"] = True
        log.info("[%s] MOCK production complete", self.name)
        return state

    # -- Main entry point --------------------------------------------------

    def run(self, state: PipelineState) -> PipelineState:
        """Generate visuals, video, TTS audio, and optionally upload to YouTube."""
        if state.get("mock_mode"):
            return self._mock_run(state)

        log.info("[%s] Starting production pipeline", self.name)

        # 0. Ensure script exists — call ContentAgent if upstream didn't provide one
        script = state.get("script", "")
        if not script or script.startswith("[STUB]") or script.startswith("[ERROR]"):
            log.warning("[%s] No script in state — invoking ContentAgent to generate one",
                        self.name)
            from src.agents.content import ContentAgent
            content_agent = ContentAgent()
            state = content_agent.run(state)
            script = state.get("script", "")
            if not script or script.startswith("[ERROR]"):
                log.error("[%s] ContentAgent failed to produce a script — skipping video",
                          self.name)

        # 1. Generate subject image via Gemini Image API (white bg, no text)
        base_thumb_path = self.generate_thumbnail(state)

        # 2. Build thumbnail: rembg cutout -> dark gradient bg -> Pillow text
        thumbnail_path = None
        if base_thumb_path:
            title = state.get("topic", "Untitled Video")
            try:
                thumbnail_path = self._build_thumbnail(base_thumb_path, title)
            except Exception as exc:
                log.warning("[%s] Thumbnail composition failed: %s -- using base image",
                            self.name, exc)
                thumbnail_path = base_thumb_path

        # 3. Generate video (Wan 2.2 clips + per-section TTS + MoviePy assembly)
        video_path = None
        if state.get("script"):
            video_path = self.generate_video(state)

        # 4. YouTube upload handled by publishing agent via MCP server (port 8001)
        #    Direct OAuth upload skipped — it hangs in headless/background mode
        #    when token.json / credentials.json are missing.
        youtube_id = None

        # Populate state with whatever succeeded (non-blocking pipeline)
        # NOTE: publishing agent reads video from visuals["final_video"]
        state["visuals"] = {
            "thumbnail": thumbnail_path or "[unavailable] Gemini API not reachable",
            "final_video": video_path or "",
            "broll": [],
            "lower_thirds": [],
        }
        state["audio"] = {
            "tts": "[generated per-section]" if video_path else "[unavailable] TTS not reachable",
            "music_bed": "[pending] music bed requires manual selection",
            "duration_seconds": len(state.get("script", "").split()) / 2.6,
            "wpm": 155,
        }
        if video_path:
            state["video_path"] = video_path
        if youtube_id:
            state["youtube_id"] = youtube_id

        # Set synthetic content flag — edge-tts is AI-generated audio (QC-41)
        state.setdefault("metadata", {})["synthetic_content_flag"] = True

        # Log summary
        thumb_status = "OK" if thumbnail_path else "SKIPPED"
        video_status = "OK" if video_path else "SKIPPED"
        yt_status = youtube_id or "SKIPPED"
        log.info("[%s] Production complete -- thumbnail=%s, video=%s, youtube=%s",
                 self.name, thumb_status, video_status, yt_status)
        return state
