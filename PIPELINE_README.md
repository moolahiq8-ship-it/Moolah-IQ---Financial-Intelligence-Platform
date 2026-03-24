# Moolah IQ V3.8.2 — YouTube Automation Pipeline

12-agent LangGraph system for automated personal finance video production.

## Architecture

```
Research (Gemini Pro)
    → Decision (Ollama llama4:16x17b)
    → Content (Claude Opus 4.6)
    → Newsletter (Claude Opus 4.6)
    → Production (ComfyUI + Qwen3-TTS + DaVinci)
    → SEO
    → QC (57-point checklist) ←──── retry loop
    → Compliance (BLOCK authority)
    → Publishing (Postiz + MCPs)
    → Analytics
    → Optimization (closed-loop feedback)
```

## Setup

```bash
cp .env.example .env
# Fill in API keys

pip install -r requirements.txt
```

## Run

```bash
python -m src.orchestrator
```

## Test

```bash
pytest
```

## Hardware Target

PowerSpec AI100: RTX 5090 32GB VRAM, 128GB RAM, Threadripper 9960X.
