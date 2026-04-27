import asyncio
import os
import re
from tavily import TavilyClient

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")


def _search_walkscore(query: str) -> dict:
    client = TavilyClient(api_key=TAVILY_API_KEY)
    return client.search(query=query, include_answer="basic", search_depth="advanced")


async def get_walkscore_data(address: str, city: str, state: str, lat: float = None, lon: float = None) -> dict:
    try:
        result = await asyncio.to_thread(_search_walkscore, f"{city}, {state} walk score walkability")
        answer = result.get("answer") or ""

        walk_score = None
        numbers = re.findall(r'\b(\d{1,3})\b', answer)
        for n in numbers:
            v = int(n)
            if 0 <= v <= 100:
                walk_score = v
                break

        return {"walk_score": walk_score}
    except Exception:
        return {}
