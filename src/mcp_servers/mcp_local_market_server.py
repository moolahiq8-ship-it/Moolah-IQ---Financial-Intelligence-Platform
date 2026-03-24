"""MCP Local Market Server — Market data and economic indicators.

FastAPI server on port 8005. Provides tools for stock/crypto market data,
economic calendar, and Fed rate information using free public APIs
(yfinance for market data, FRED for economic indicators).
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timedelta
from typing import Any

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

load_dotenv()

log = logging.getLogger("mcp-local-market")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s %(message)s")

FRED_API_KEY = os.getenv("FRED_API_KEY", "")
FRED_BASE = "https://api.stlouisfed.org/fred"

app = FastAPI(title="MCP Local Market Server", version="1.0.0")


# ── Request models ────────────────────────────────────────────────────

class MarketDataRequest(BaseModel):
    symbol: str
    period: str = "1mo"


class EconomicCalendarRequest(BaseModel):
    days_ahead: int = 7


# ── Startup / Health ──────────────────────────────────────────────────

@app.on_event("startup")
async def startup() -> None:
    fred_status = "SET" if FRED_API_KEY else "MISSING (some endpoints will be limited)"
    log.info("[mcp-local-market] Server starting on port 8005 | FRED_API_KEY=%s", fred_status)


@app.get("/health")
async def health() -> dict[str, str]:
    return {
        "status": "ok",
        "service": "mcp-local-market",
        "port": "8005",
        "fred_api_key": "configured" if FRED_API_KEY else "not configured",
    }


@app.get("/tools")
async def list_tools() -> list[dict[str, Any]]:
    return [
        {
            "name": "get_market_data",
            "description": "Get price history and stats for a stock or crypto symbol via yfinance.",
            "parameters": {
                "symbol": {"type": "string", "required": True},
                "period": {"type": "string", "default": "1mo", "enum": ["1d", "5d", "1mo", "3mo", "6mo", "1y", "5y"]},
            },
        },
        {
            "name": "get_economic_calendar",
            "description": "Get upcoming economic events and data releases for the next N days.",
            "parameters": {"days_ahead": {"type": "integer", "default": 7}},
        },
        {
            "name": "get_fed_rates",
            "description": "Get current Federal Reserve interest rates (Fed Funds, 10Y Treasury, 30Y Mortgage).",
            "parameters": {},
        },
    ]


# ── Tool endpoints ────────────────────────────────────────────────────

@app.post("/tools/get_market_data")
async def get_market_data(req: MarketDataRequest) -> dict[str, Any]:
    """Fetch market data for a symbol using yfinance."""
    log.info("[mcp-local-market] get_market_data: symbol=%s period=%s", req.symbol, req.period)

    valid_periods = {"1d", "5d", "1mo", "3mo", "6mo", "1y", "5y"}
    if req.period not in valid_periods:
        raise HTTPException(status_code=400, detail=f"Invalid period: {req.period}. Use one of {valid_periods}")

    try:
        import yfinance as yf

        ticker = yf.Ticker(req.symbol)
        hist = ticker.history(period=req.period)

        if hist.empty:
            raise HTTPException(status_code=404, detail=f"No data found for symbol: {req.symbol}")

        info = ticker.info
        latest = hist.iloc[-1]
        first = hist.iloc[0]
        period_return = ((latest["Close"] - first["Close"]) / first["Close"]) * 100

        # Build price history (downsample to max 60 points for readability)
        step = max(1, len(hist) // 60)
        price_history = [
            {
                "date": idx.strftime("%Y-%m-%d"),
                "close": round(row["Close"], 2),
                "volume": int(row["Volume"]),
            }
            for idx, row in hist.iloc[::step].iterrows()
        ]

        return {
            "symbol": req.symbol.upper(),
            "name": info.get("shortName", req.symbol),
            "currency": info.get("currency", "USD"),
            "period": req.period,
            "current_price": round(latest["Close"], 2),
            "period_high": round(hist["High"].max(), 2),
            "period_low": round(hist["Low"].min(), 2),
            "period_return_pct": round(period_return, 2),
            "avg_volume": int(hist["Volume"].mean()),
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "dividend_yield": info.get("dividendYield"),
            "fifty_two_week_high": info.get("fiftyTwoWeekHigh"),
            "fifty_two_week_low": info.get("fiftyTwoWeekLow"),
            "data_points": len(price_history),
            "price_history": price_history,
        }
    except ImportError:
        raise HTTPException(status_code=500, detail="yfinance package not installed")
    except Exception as exc:
        log.error("[mcp-local-market] yfinance error: %s", exc)
        raise HTTPException(status_code=500, detail=f"Failed to fetch market data: {exc}") from exc


@app.post("/tools/get_economic_calendar")
async def get_economic_calendar(req: EconomicCalendarRequest) -> dict[str, Any]:
    """Get upcoming economic events using FRED release calendar."""
    log.info("[mcp-local-market] get_economic_calendar: days_ahead=%d", req.days_ahead)

    if not FRED_API_KEY:
        raise HTTPException(status_code=500, detail="FRED_API_KEY not configured")

    today = datetime.now()
    end_date = today + timedelta(days=req.days_ahead)

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.get(
                f"{FRED_BASE}/releases/dates",
                params={
                    "api_key": FRED_API_KEY,
                    "file_type": "json",
                    "realtime_start": today.strftime("%Y-%m-%d"),
                    "realtime_end": end_date.strftime("%Y-%m-%d"),
                    "include_release_dates_with_no_data": "false",
                },
            )
            resp.raise_for_status()
            data = resp.json()

        releases = data.get("release_dates", [])
        events = []
        for release in releases:
            events.append({
                "date": release.get("date"),
                "release_id": release.get("release_id"),
                "release_name": release.get("release_name", ""),
            })

        return {
            "period_start": today.strftime("%Y-%m-%d"),
            "period_end": end_date.strftime("%Y-%m-%d"),
            "days_ahead": req.days_ahead,
            "event_count": len(events),
            "events": events,
        }
    except httpx.HTTPStatusError as exc:
        log.error("[mcp-local-market] FRED API error: %s", exc.response.text)
        raise HTTPException(status_code=exc.response.status_code, detail="FRED API error") from exc
    except httpx.RequestError as exc:
        log.error("[mcp-local-market] Request failed: %s", exc)
        raise HTTPException(status_code=502, detail="Failed to reach FRED API") from exc


@app.post("/tools/get_fed_rates")
async def get_fed_rates() -> dict[str, Any]:
    """Fetch current Federal Reserve interest rates from FRED.

    Series used:
    - FEDFUNDS: Effective Federal Funds Rate
    - DGS10: 10-Year Treasury Constant Maturity Rate
    - MORTGAGE30US: 30-Year Fixed Rate Mortgage Average
    - DGS2: 2-Year Treasury (for yield curve analysis)
    """
    log.info("[mcp-local-market] get_fed_rates")

    if not FRED_API_KEY:
        raise HTTPException(status_code=500, detail="FRED_API_KEY not configured")

    series_ids = {
        "fed_funds_rate": "FEDFUNDS",
        "treasury_10y": "DGS10",
        "mortgage_30y": "MORTGAGE30US",
        "treasury_2y": "DGS2",
    }

    results: dict[str, Any] = {"as_of": datetime.now().strftime("%Y-%m-%d")}

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            for label, series_id in series_ids.items():
                resp = await client.get(
                    f"{FRED_BASE}/series/observations",
                    params={
                        "api_key": FRED_API_KEY,
                        "series_id": series_id,
                        "file_type": "json",
                        "sort_order": "desc",
                        "limit": 5,
                    },
                )
                resp.raise_for_status()
                data = resp.json()

                observations = data.get("observations", [])
                # Find the latest non-missing value
                value = None
                obs_date = None
                for obs in observations:
                    if obs.get("value") and obs["value"] != ".":
                        value = float(obs["value"])
                        obs_date = obs.get("date")
                        break

                results[label] = {
                    "value": value,
                    "date": obs_date,
                    "series_id": series_id,
                }

        # Compute yield curve spread (10Y - 2Y)
        t10 = results.get("treasury_10y", {}).get("value")
        t2 = results.get("treasury_2y", {}).get("value")
        if t10 is not None and t2 is not None:
            results["yield_curve_spread"] = {
                "value": round(t10 - t2, 2),
                "description": "10Y minus 2Y Treasury spread. Negative = inverted yield curve.",
            }

        return results
    except httpx.HTTPStatusError as exc:
        log.error("[mcp-local-market] FRED API error: %s", exc.response.text)
        raise HTTPException(status_code=exc.response.status_code, detail="FRED API error") from exc
    except httpx.RequestError as exc:
        log.error("[mcp-local-market] Request failed: %s", exc)
        raise HTTPException(status_code=502, detail="Failed to reach FRED API") from exc


# ── Main ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8005)
