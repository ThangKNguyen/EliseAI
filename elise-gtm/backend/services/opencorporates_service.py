import httpx
import os

OPENCORPORATES_BASE_URL = os.getenv("OPENCORPORATES_BASE_URL", "https://api.opencorporates.com/v0.4")


async def _search(params: dict) -> list:
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{OPENCORPORATES_BASE_URL}/companies/search", params=params)
        r.raise_for_status()
        return r.json().get("results", {}).get("companies", [])


async def get_company_registration(company: str, state: str) -> dict:
    try:
        # Try with jurisdiction first, then without if no results
        companies = await _search({"q": company, "jurisdiction_code": f"us_{state.lower()}"})
        if not companies:
            companies = await _search({"q": company, "country_code": "us"})
        if not companies:
            return {}

        top = companies[0].get("company", {})
        return {
            "company_status": top.get("current_status"),
            "company_incorporated": top.get("incorporation_date"),
            "company_jurisdiction": top.get("jurisdiction_code"),
            "company_type": top.get("company_type"),
        }
    except Exception:
        return {}
