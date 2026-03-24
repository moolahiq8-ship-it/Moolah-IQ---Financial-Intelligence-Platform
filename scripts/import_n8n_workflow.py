#!/usr/bin/env python3
"""Import the Moolah IQ n8n workflow via the n8n REST API.

Prerequisites:
    1. n8n running on localhost:5678
    2. API key created at: n8n UI → Settings → API → Add API Key
    3. Key stored in .env as N8N_API_KEY=n8n_api_...

Usage:
    python scripts/import_n8n_workflow.py
    python scripts/import_n8n_workflow.py --key n8n_api_abc123
    python scripts/import_n8n_workflow.py --url http://my-n8n:5678
    python scripts/import_n8n_workflow.py --activate    # activate after import
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent
WORKFLOW_PATH = ROOT / "config" / "n8n_workflow.json"

load_dotenv(ROOT / ".env")


def main() -> None:
    parser = argparse.ArgumentParser(description="Import Moolah IQ workflow into n8n")
    parser.add_argument("--key", default=None, help="n8n API key (or set N8N_API_KEY in .env)")
    parser.add_argument("--url", default="http://localhost:5678", help="n8n base URL")
    parser.add_argument("--activate", action="store_true", help="Activate the workflow after import")
    args = parser.parse_args()

    api_key = args.key or os.getenv("N8N_API_KEY")
    if not api_key:
        print("ERROR: No API key provided.")
        print()
        print("Create one in n8n:")
        print("  1. Open http://localhost:5678 in your browser")
        print("  2. Go to Settings (gear icon, bottom-left)")
        print("  3. Click 'n8n API' in the sidebar")
        print("  4. Click 'Create an API key'")
        print("  5. Copy the key and either:")
        print("     a. Add N8N_API_KEY=<key> to your .env file, or")
        print("     b. Run: python scripts/import_n8n_workflow.py --key <key>")
        sys.exit(1)

    base = args.url.rstrip("/")
    headers = {"X-N8N-API-KEY": api_key, "Content-Type": "application/json"}

    # ── Health check ──────────────────────────────────────────────
    print(f"Connecting to n8n at {base} ...")
    try:
        r = httpx.get(f"{base}/healthz", timeout=5)
        r.raise_for_status()
        print(f"  n8n is healthy: {r.json()}")
    except Exception as exc:
        print(f"ERROR: Cannot reach n8n at {base} -- {exc}")
        print("  Is n8n running?  Start it with: n8n start")
        sys.exit(1)

    # ── Verify API key ────────────────────────────────────────────
    print("Verifying API key ...")
    r = httpx.get(f"{base}/api/v1/workflows", headers=headers, params={"limit": 1}, timeout=10)
    if r.status_code == 401:
        print("ERROR: API key rejected (401 Unauthorized).")
        print("  Check that your key is correct and hasn't expired.")
        sys.exit(1)
    r.raise_for_status()
    existing = r.json().get("data", [])
    print(f"  Authenticated. {len(existing)} existing workflow(s).")

    # ── Load and sanitize workflow JSON ───────────────────────────
    workflow_json = json.loads(WORKFLOW_PATH.read_text(encoding="utf-8"))
    wf_name = workflow_json.get("name", "Moolah IQ Workflow")

    # n8n API only accepts these top-level keys; strip extras like tags/meta
    allowed_keys = {"name", "nodes", "connections", "settings", "staticData"}
    payload = {k: v for k, v in workflow_json.items() if k in allowed_keys}

    r = httpx.get(f"{base}/api/v1/workflows", headers=headers, params={"limit": 100}, timeout=10)
    r.raise_for_status()
    all_wfs = r.json().get("data", [])
    dupes = [w for w in all_wfs if w.get("name") == wf_name]
    if dupes:
        print(f"\n  WARNING: Workflow '{wf_name}' already exists (id={dupes[0]['id']}).")
        print(f"  Updating existing workflow instead of creating a duplicate.\n")
        wf_id = dupes[0]["id"]
        r = httpx.put(
            f"{base}/api/v1/workflows/{wf_id}",
            headers=headers,
            json=payload,
            timeout=15,
        )
        r.raise_for_status()
        result = r.json()
        print(f"  Updated workflow: id={result.get('id')}")
    else:
        # ── Import ────────────────────────────────────────────────
        print(f"Importing '{wf_name}' ...")
        r = httpx.post(
            f"{base}/api/v1/workflows",
            headers=headers,
            json=payload,
            timeout=15,
        )
        if r.status_code >= 400:
            print(f"ERROR: Import failed ({r.status_code})")
            print(f"  {r.text[:500]}")
            sys.exit(1)
        result = r.json()
        wf_id = result.get("id")
        print(f"  Created workflow: id={wf_id}")

    # ── Activate if requested ─────────────────────────────────────
    if args.activate:
        print(f"Activating workflow {wf_id} ...")
        r = httpx.post(
            f"{base}/api/v1/workflows/{wf_id}/activate",
            headers=headers,
            timeout=10,
        )
        if r.status_code >= 400:
            print(f"  WARNING: Activation failed ({r.status_code}): {r.text[:200]}")
        else:
            print(f"  Activated.")

    # ── Verify ────────────────────────────────────────────────────
    print(f"\nVerifying workflow {wf_id} ...")
    r = httpx.get(f"{base}/api/v1/workflows/{wf_id}", headers=headers, timeout=10)
    r.raise_for_status()
    wf = r.json()

    active = wf.get("active", False)
    nodes = wf.get("nodes", [])
    print(f"\n{'=' * 50}")
    print(f"  Workflow imported successfully!")
    print(f"{'=' * 50}")
    print(f"  ID:       {wf.get('id')}")
    print(f"  Name:     {wf.get('name')}")
    print(f"  Active:   {active}")
    print(f"  Nodes:    {len(nodes)}")
    print(f"  Created:  {wf.get('createdAt', 'N/A')}")
    print(f"  URL:      {base}/workflow/{wf.get('id')}")
    print(f"{'=' * 50}")

    if not active and not args.activate:
        print(f"\n  Workflow is inactive. To activate:")
        print(f"    python scripts/import_n8n_workflow.py --activate")
        print(f"    or toggle it on in the n8n UI.")


if __name__ == "__main__":
    main()
