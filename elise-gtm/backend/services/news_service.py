import httpx
import os
import json
from datetime import datetime, timedelta

NEWS_BASE_URL = os.getenv("NEWS_BASE_URL", "https://newsapi.org/v2")
NEWS_API_KEY = os.getenv("NEWS_API_KEY")

_FROM_DATE = (datetime.utcnow() - timedelta(days=30)).strftime("%Y-%m-%d")


async def _fetch_articles(query: str) -> list:
    params = {
        "q": query,
        "sortBy": "publishedAt",
        "from": _FROM_DATE,
        "pageSize": 3,
        "language": "en",
        "apiKey": NEWS_API_KEY,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(f"{NEWS_BASE_URL}/everything", params=params)
        r.raise_for_status()
        data = r.json()

    return [
        {
            "title": a.get("title", ""),
            "source": a.get("source", {}).get("name", ""),
            "publishedAt": a.get("publishedAt", ""),
            "url": a.get("url", ""),
        }
        for a in data.get("articles", [])
    ]


async def get_company_news(company: str) -> str:
    try:
        articles = await _fetch_articles(f'"{company}" property management')
        return json.dumps(articles)
    except Exception:
        return json.dumps([])


async def get_city_rental_news(city: str, state: str) -> str:
    try:
        articles = await _fetch_articles(f"{city} {state} rental housing market")
        return json.dumps(articles)
    except Exception:
        return json.dumps([])
