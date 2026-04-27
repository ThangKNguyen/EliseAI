import asyncio
import os
import json
from typing import Optional

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


def _call_gemini(prompt: str) -> str:
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=GEMINI_API_KEY)
    response = client.models.generate_content(
        model="gemini-2.5-flash-lite",
        config=types.GenerateContentConfig(
            system_instruction="You are a senior B2B sales intelligence analyst specializing in property management software.",
        ),
        contents=prompt,
    )
    return response.text


async def generate_ai_summary(
    company: str,
    city: str,
    state: str,
    score: int,
    total_rental_units,
    population_growth_5yr,
    renter_ratio,
    unemployment_rate,
    fmr_two_br,
    company_summary: str,
    company_news_headlines: str,
    sales_insights: str,
) -> str:
    prompt = f"""You are a senior SDR at EliseAI, which sells AI-powered leasing automation software to property management companies.

Analyze this enriched lead and write a 5-6 sentence professional assessment. Your analysis must be grounded in the specific market data for {city}, {state} — not just the company's national reputation. If the company is large but this location's market data is weak (small rental market, slow growth, high unemployment), say so plainly and reflect it in your prioritization recommendation. Acknowledge company scale as context only, then focus on what the local data actually tells us.

LEAD DATA:
- Company: {company}
- Market: {city}, {state}
- Lead Score: {score}/100
- Rental Units in Market: {total_rental_units or 'N/A'} (local market size, not company portfolio)
- Population Growth (5yr): {f'{population_growth_5yr}%' if population_growth_5yr is not None else 'N/A'}
- Renter Ratio: {f'{renter_ratio:.1%}' if renter_ratio else 'N/A'}
- Unemployment Rate: {f'{unemployment_rate}%' if unemployment_rate is not None else 'N/A'}
- 2BR Fair Market Rent: {f'${fmr_two_br}' if fmr_two_br else 'N/A'}
- Company Info: {company_summary or 'N/A'}
- Recent News: {company_news_headlines or 'N/A'}
- AI Insights: {sales_insights or 'N/A'}

Cover in order: (1) brief note on the company's scale, (2) honest assessment of the {city} local market using the data above, (3) whether this specific location is a strong or secondary outreach target, (4) clear prioritization recommendation. Be direct — if the local market is small or weak, say that. Return plain text only, no bullet points, no headers."""

    try:
        raw = await asyncio.to_thread(_call_gemini, prompt)
        return raw.strip()
    except Exception:
        return ""


async def generate_insights(
    company: str,
    city: str,
    state: str,
    score: int,
    total_rental_units: Optional[int],
    population: Optional[int],
    population_growth_5yr: Optional[float],
    renter_ratio: Optional[float],
    unemployment_rate: Optional[float],
    gdp_growth_rate: Optional[float],
    fmr_two_br: Optional[float],
    company_summary: Optional[str],
    company_news_headlines: Optional[str],
    city_overview: Optional[str],
    market_news: Optional[str],
    city_rental_news: Optional[str],
    company_status: Optional[str],
    company_incorporated: Optional[str],
) -> dict:
    prompt = f"""You are analyzing a lead for EliseAI's sales team. EliseAI sells AI-powered property management software.

LEAD:
- Company: {company}
- Location: {city}, {state}
- Score: {score}/100

MARKET DATA:
- Rental Units: {total_rental_units or 'N/A'}
- Population: {population or 'N/A'}
- Population Growth (5yr): {f'{population_growth_5yr}%' if population_growth_5yr is not None else 'N/A'}
- Renter Ratio: {f'{renter_ratio:.1%}' if renter_ratio else 'N/A'}
- Unemployment: {f'{unemployment_rate}%' if unemployment_rate is not None else 'N/A'}
- GDP Growth: {f'{gdp_growth_rate}%' if gdp_growth_rate is not None else 'N/A'}
- 2BR FMR: {f'${fmr_two_br}' if fmr_two_br else 'N/A'}

COMPANY:
- Summary: {company_summary or 'N/A'}
- Status: {company_status or 'N/A'}
- Incorporated: {company_incorporated or 'N/A'}
- Recent News: {company_news_headlines or 'N/A'}

CITY:
- Overview: {city_overview or 'N/A'}
- Market News: {market_news or 'N/A'}
- Rental News: {city_rental_news or 'N/A'}

Return ONLY a JSON object (no markdown, no explanation):
{{
  "sales_insights": {{
    "Market Overview": "2-3 sentences on the rental market opportunity",
    "Economic Health": "2-3 sentences on economic indicators for this lead",
    "Property Context": "2-3 sentences on the property management landscape",
    "Company Signals": "2-3 sentences synthesizing this company's multifamily portfolio scale, recent activity, and the specific operational pain points that make them a strong fit for EliseAI's AI leasing automation",
    "Market News": "2-3 sentences summarizing relevant recent news"
  }},
  "talk_track": [
    "Opening hook referencing a specific local market stat",
    "Value proposition tied to their market context",
    "Call to action with urgency driver"
  ],
  "email_subject": "Compelling subject line under 60 chars",
  "draft_email": "Professional 3-paragraph cold email. Para 1: personalized hook. Para 2: value prop with specific data. Para 3: low-friction CTA."
}}"""

    try:
        raw = await asyncio.to_thread(_call_gemini, prompt)
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1] if "\n" in raw else raw[3:]
        if raw.endswith("```"):
            raw = raw.rsplit("```", 1)[0]
        result = json.loads(raw.strip())
        return {
            "sales_insights": json.dumps(result.get("sales_insights", {})),
            "talk_track": json.dumps(result.get("talk_track", [])),
            "email_subject": result.get("email_subject", ""),
            "draft_email": result.get("draft_email", ""),
        }
    except Exception:
        return {
            "sales_insights": json.dumps({}),
            "talk_track": json.dumps([]),
            "email_subject": "",
            "draft_email": "",
        }
