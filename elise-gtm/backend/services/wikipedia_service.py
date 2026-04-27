import httpx

WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php"

STATE_NAMES = {
    "AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas",
    "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware",
    "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho",
    "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas",
    "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland",
    "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi",
    "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada",
    "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York",
    "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma",
    "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina",
    "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah",
    "VT": "Vermont", "VA": "Virginia", "WA": "Washington", "WV": "West Virginia",
    "WI": "Wisconsin", "WY": "Wyoming", "DC": "District of Columbia",
}


async def _fetch_extract(title: str) -> str:
    params = {
        "action": "query",
        "prop": "extracts",
        "exintro": True,
        "explaintext": True,
        "redirects": 1,
        "titles": title,
        "format": "json",
    }
    headers = {"User-Agent": "EliseAI-LeadEnrichment/1.0 (contact@elise.ai)"}
    async with httpx.AsyncClient(timeout=10, headers=headers) as client:
        r = await client.get(WIKIPEDIA_API, params=params)
        r.raise_for_status()
        pages = r.json().get("query", {}).get("pages", {})
    for page_id, page in pages.items():
        if page_id != "-1":
            return page.get("extract", "")
    return ""


async def get_city_overview(city: str, state: str) -> str:
    state_name = STATE_NAMES.get(state.upper(), state)
    candidates = [f"{city}, {state_name}", city]

    try:
        for title in candidates:
            print(f"[Wikipedia] trying title: {title!r}")
            extract = await _fetch_extract(title)
            print(f"[Wikipedia] got extract length: {len(extract)}")
            if extract:
                return extract
    except Exception as e:
        print(f"[Wikipedia] error: {e}")

    return ""
