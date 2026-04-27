import httpx
import os

HUD_BASE_URL = os.getenv("HUD_BASE_URL", "https://www.huduser.gov/hudapi/public")
HUD_API_KEY = os.getenv("HUD_API_KEY", "")


def _extract_fmr(entry: dict) -> dict:
    # Small Area FMR metros nest data under basicdata — use the "MSA level" row
    if entry.get("smallarea_status") in ("1", 1) and isinstance(entry.get("basicdata"), list):
        msa_row = next((r for r in entry["basicdata"] if r.get("zip_code") == "MSA level"), None)
        if msa_row:
            entry = msa_row
    return {
        "fmr_one_br": entry.get("One-Bedroom"),
        "fmr_two_br": entry.get("Two-Bedroom"),
        "fmr_three_br": entry.get("Three-Bedroom"),
    }


async def get_fair_market_rents(city: str, state: str) -> dict:
    if not HUD_API_KEY:
        return {}

    headers = {"Authorization": f"Bearer {HUD_API_KEY}"}
    city_lower = city.lower()

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"{HUD_BASE_URL}/fmr/statedata/{state.upper()}",
                headers=headers,
            )
            r.raise_for_status()
            data = r.json().get("data", {})

        # Search metro areas first (e.g. "Austin, TX MSA")
        for area in data.get("metroareas", []):
            if city_lower in area.get("name", "").lower():
                return _extract_fmr(area)

        # Fall back to counties
        for county in data.get("counties", []):
            name = county.get("county_name", "") or county.get("town_name", "")
            if city_lower in name.lower():
                return _extract_fmr(county)

    except Exception:
        pass

    return {}
