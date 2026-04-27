import asyncio
import os
from tavily import TavilyClient

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")


def _search(query: str) -> dict:
    client = TavilyClient(api_key=TAVILY_API_KEY)
    return client.search(query=query, include_answer="basic", search_depth="advanced")


async def get_company_data(company: str) -> str:
    try:
        result = await asyncio.to_thread(_search, f"{company} property management company portfolio")
        return result.get("answer") or ""
    except Exception:
        return ""


async def get_market_news(city: str, state: str) -> str:
    try:
        result = await asyncio.to_thread(_search, f"{city}, {state} rental market 2025")
        return result.get("answer") or ""
    except Exception:
        return ""
