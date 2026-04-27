import httpx
import os

FRED_BASE_URL = os.getenv("FRED_BASE_URL", "https://api.stlouisfed.org/fred")
FRED_API_KEY = os.getenv("FRED_API_KEY")


async def _fetch_latest(series_id: str) -> float | None:
    params = {
        "series_id": series_id,
        "api_key": FRED_API_KEY,
        "file_type": "json",
        "sort_order": "desc",
        "limit": 1,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{FRED_BASE_URL}/series/observations", params=params)
        r.raise_for_status()
        data = r.json()
    obs = data.get("observations", [])
    if obs:
        try:
            return float(obs[0]["value"])
        except (ValueError, KeyError):
            return None
    return None


async def get_fred_data(state: str) -> dict:
    state_series = f"{state.upper()}UR"

    unemployment_rate = None
    gdp_growth_rate = None
    housing_price_trend = None

    try:
        unemployment_rate = await _fetch_latest(state_series)
    except Exception:
        pass

    try:
        gdp_growth_rate = await _fetch_latest("A191RL1Q225SBEA")
    except Exception:
        pass

    try:
        val = await _fetch_latest("CSUSHPINSA")
        housing_price_trend = str(val) if val is not None else None
    except Exception:
        pass

    return {
        "unemployment_rate": unemployment_rate,
        "gdp_growth_rate": gdp_growth_rate,
        "housing_price_trend": housing_price_trend,
    }
