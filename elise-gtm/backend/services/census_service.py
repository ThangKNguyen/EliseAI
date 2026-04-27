import httpx
import os

CENSUS_BASE_URL = os.getenv("CENSUS_BASE_URL", "https://api.census.gov/data")
CENSUS_API_KEY = os.getenv("CENSUS_API_KEY")

STATE_FIPS = {
    "AL": "01", "AK": "02", "AZ": "04", "AR": "05", "CA": "06",
    "CO": "08", "CT": "09", "DE": "10", "FL": "12", "GA": "13",
    "HI": "15", "ID": "16", "IL": "17", "IN": "18", "IA": "19",
    "KS": "20", "KY": "21", "LA": "22", "ME": "23", "MD": "24",
    "MA": "25", "MI": "26", "MN": "27", "MS": "28", "MO": "29",
    "MT": "30", "NE": "31", "NV": "32", "NH": "33", "NJ": "34",
    "NM": "35", "NY": "36", "NC": "37", "ND": "38", "OH": "39",
    "OK": "40", "OR": "41", "PA": "42", "RI": "44", "SC": "45",
    "SD": "46", "TN": "47", "TX": "48", "UT": "49", "VT": "50",
    "VA": "51", "WA": "53", "WV": "54", "WI": "55", "WY": "56",
    "DC": "11",
}


def _safe_int(val):
    try:
        v = int(val)
        return v if v >= 0 else None
    except (ValueError, TypeError):
        return None


async def _query_acs5(year: int, fips: str, variables: str) -> list[dict]:
    params = {
        "get": variables,
        "for": "place:*",
        "in": f"state:{fips}",
        "key": CENSUS_API_KEY,
    }
    async with httpx.AsyncClient(timeout=20) as client:
        r = await client.get(f"{CENSUS_BASE_URL}/{year}/acs/acs5", params=params)
        r.raise_for_status()
        data = r.json()
    headers = data[0]
    return [dict(zip(headers, row)) for row in data[1:]]


async def get_census_data(city: str, state: str) -> dict:
    fips = STATE_FIPS.get(state.upper())
    if not fips:
        return {}

    try:
        rows = await _query_acs5(
            2022, fips,
            "NAME,B25003_001E,B25003_003E,B01003_001E,B19013_001E"
        )
    except Exception:
        return {}

    city_lower = city.lower()
    match = next((r for r in rows if city_lower in r.get("NAME", "").lower()), None)
    if not match:
        return {}

    total_units = _safe_int(match.get("B25003_001E"))
    renter_units = _safe_int(match.get("B25003_003E"))
    population = _safe_int(match.get("B01003_001E"))
    median_income = _safe_int(match.get("B19013_001E"))

    renter_ratio = None
    if total_units and renter_units and total_units > 0:
        renter_ratio = round(renter_units / total_units, 4)

    population_growth_5yr = None
    try:
        old_rows = await _query_acs5(2017, fips, "NAME,B01003_001E")
        old_match = next((r for r in old_rows if city_lower in r.get("NAME", "").lower()), None)
        if old_match:
            old_pop = _safe_int(old_match.get("B01003_001E"))
            if old_pop and population and old_pop > 0:
                population_growth_5yr = round((population - old_pop) / old_pop * 100, 2)
    except Exception:
        pass

    return {
        "total_rental_units": renter_units,
        "population": population,
        "median_income": median_income,
        "renter_ratio": renter_ratio,
        "population_growth_5yr": population_growth_5yr,
    }
