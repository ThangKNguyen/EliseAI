from typing import Optional
import json


def calculate_score(
    total_rental_units: Optional[int],
    population_growth_5yr: Optional[float],
    unemployment_rate: Optional[float],
    renter_ratio: Optional[float],
    company_summary: Optional[str],
    company_news_headlines: Optional[str],
    company_status: Optional[str],
    company_incorporated: Optional[str],
    fmr_two_br: Optional[float],
) -> int:
    score = 0

    # Rental market size — 30 pts
    if total_rental_units:
        if total_rental_units >= 200_000:
            score += 30
        elif total_rental_units >= 100_000:
            score += 22
        elif total_rental_units >= 50_000:
            score += 15
        else:
            score += 5

    # Population growth — 20 pts
    if population_growth_5yr is not None:
        if population_growth_5yr >= 10:
            score += 20
        elif population_growth_5yr >= 5:
            score += 15
        elif population_growth_5yr >= 0:
            score += 8
        else:
            score += 0

    # Economic health (unemployment) — 20 pts
    if unemployment_rate is not None:
        if unemployment_rate < 4:
            score += 20
        elif unemployment_rate <= 6:
            score += 13
        else:
            score += 5

    # Renter ratio — 15 pts
    if renter_ratio is not None:
        if renter_ratio >= 0.50:
            score += 15
        elif renter_ratio >= 0.40:
            score += 10
        else:
            score += 5

    # Company signals — 15 pts
    company_pts = 3
    if company_summary:
        summary_lower = company_summary.lower()
        if any(kw in summary_lower for kw in ["large", "portfolio", "units", "properties", "expanding", "growth"]):
            company_pts = 15
        elif any(kw in summary_lower for kw in ["mid", "medium", "regional", "established"]):
            company_pts = 10

    # NewsAPI boost: recent article < 30 days → +3 (capped at 15)
    if company_news_headlines:
        try:
            articles = json.loads(company_news_headlines)
            if isinstance(articles, list) and len(articles) > 0:
                company_pts = min(15, company_pts + 3)
        except (json.JSONDecodeError, TypeError):
            pass

    score += company_pts

    # Hard cap: dissolved company
    if company_status and company_status.lower() == "dissolved":
        return min(score, 20)

    # HUD FMR bonus modifier
    if fmr_two_br is not None:
        if fmr_two_br >= 2000:
            score += 5
        elif fmr_two_br < 900:
            score -= 5

    # OpenCorporates established bonus
    if company_status and company_status.lower() == "active" and company_incorporated:
        try:
            incorporated_year = int(company_incorporated[:4])
            from datetime import datetime
            if (datetime.now().year - incorporated_year) >= 5:
                score += 3
        except (ValueError, TypeError):
            pass

    return max(0, min(100, score))


def get_priority_label(score: int) -> str:
    if score >= 80:
        return "High Priority"
    elif score >= 60:
        return "Medium Priority"
    else:
        return "Low Priority"
