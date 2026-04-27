from sqlalchemy.orm import Session
from models.lead import Lead, LeadEnrichment, LeadStatus
from scoring import calculate_score
from services.census_service import get_census_data
from services.fred_service import get_fred_data
from services.walkscore_service import get_walkscore_data
from services.tavily_service import get_company_data, get_market_news
from services.news_service import get_company_news, get_city_rental_news
from services.wikipedia_service import get_city_overview
from services.hud_service import get_fair_market_rents
from services.opencorporates_service import get_company_registration
from services.gemini_service import generate_insights
import asyncio


async def enrich_lead(lead: Lead, db: Session) -> bool:
    """
    Run the full enrichment pipeline for a single lead.
    Saves results to LeadEnrichment. Updates lead status → processed.
    Returns True on success, False on failure.
    """
    try:
        # Step 1: Census
        census = await get_census_data(lead.city, lead.state)

        # Step 2: FRED
        fred = await get_fred_data(lead.state)

        # Step 3: WalkScore
        walkscore = await get_walkscore_data(lead.property_address, lead.city, lead.state)

        # Step 4a: Tavily
        company_summary = await get_company_data(lead.company)
        market_news = await get_market_news(lead.city, lead.state)

        # Step 4b: NewsAPI
        company_news_headlines = await get_company_news(lead.company)
        city_rental_news = await get_city_rental_news(lead.city, lead.state)

        # Step 4c: Wikipedia
        city_overview = await get_city_overview(lead.city, lead.state)

        # Step 4d: HUD Fair Market Rents
        hud = await get_fair_market_rents(lead.city, lead.state)

        # Step 4e: OpenCorporates (best-effort)
        corp = await get_company_registration(lead.company, lead.state)

        # Step 5: Score
        score = calculate_score(
            total_rental_units=census.get("total_rental_units"),
            population_growth_5yr=census.get("population_growth_5yr"),
            unemployment_rate=fred.get("unemployment_rate"),
            renter_ratio=census.get("renter_ratio"),
            company_summary=company_summary,
            company_news_headlines=company_news_headlines,
            company_status=corp.get("company_status"),
            company_incorporated=corp.get("company_incorporated"),
            fmr_two_br=hud.get("fmr_two_br"),
        )

        # Step 6: Gemini
        gemini = await generate_insights(
            company=lead.company,
            city=lead.city,
            state=lead.state,
            score=score,
            total_rental_units=census.get("total_rental_units"),
            population=census.get("population"),
            population_growth_5yr=census.get("population_growth_5yr"),
            renter_ratio=census.get("renter_ratio"),
            unemployment_rate=fred.get("unemployment_rate"),
            gdp_growth_rate=fred.get("gdp_growth_rate"),
            fmr_two_br=hud.get("fmr_two_br"),
            company_summary=company_summary,
            company_news_headlines=company_news_headlines,
            city_overview=city_overview,
            market_news=market_news,
            city_rental_news=city_rental_news,
            company_status=corp.get("company_status"),
            company_incorporated=corp.get("company_incorporated"),
        )

        # Step 7: Save to DB
        enrichment = db.query(LeadEnrichment).filter(LeadEnrichment.lead_id == lead.id).first()
        if not enrichment:
            enrichment = LeadEnrichment(lead_id=lead.id)
            db.add(enrichment)

        enrichment.total_rental_units = census.get("total_rental_units")
        enrichment.population = census.get("population")
        enrichment.population_growth_5yr = census.get("population_growth_5yr")
        enrichment.median_income = census.get("median_income")
        enrichment.renter_ratio = census.get("renter_ratio")
        enrichment.unemployment_rate = fred.get("unemployment_rate")
        enrichment.gdp_growth_rate = fred.get("gdp_growth_rate")
        enrichment.housing_price_trend = fred.get("housing_price_trend")
        enrichment.walk_score = walkscore.get("walk_score")
        enrichment.company_summary = company_summary
        enrichment.market_news = market_news
        enrichment.company_news_headlines = company_news_headlines
        enrichment.city_rental_news = city_rental_news
        enrichment.city_overview = city_overview
        enrichment.fmr_one_br = hud.get("fmr_one_br")
        enrichment.fmr_two_br = hud.get("fmr_two_br")
        enrichment.fmr_three_br = hud.get("fmr_three_br")
        enrichment.company_status = corp.get("company_status")
        enrichment.company_incorporated = corp.get("company_incorporated")
        enrichment.company_jurisdiction = corp.get("company_jurisdiction")
        enrichment.company_type = corp.get("company_type")
        enrichment.sales_insights = gemini.get("sales_insights")
        enrichment.talk_track = gemini.get("talk_track")
        enrichment.draft_email = gemini.get("draft_email")
        enrichment.email_subject = gemini.get("email_subject")

        lead.score = score
        lead.status = LeadStatus.processed

        db.commit()
        return True

    except Exception as e:
        print(f"Pipeline failed for lead {lead.id}: {e}")
        db.rollback()
        return False


async def run_pipeline(db: Session) -> dict:
    """
    Fetch all pending leads and run enrichment on each.
    Returns {"processed": n, "failed": n}
    """
    pending_leads = db.query(Lead).filter(Lead.status == LeadStatus.pending).all()

    results = await asyncio.gather(
        *[enrich_lead(lead, db) for lead in pending_leads],
        return_exceptions=True,
    )

    processed = sum(1 for r in results if r is True)
    failed = len(results) - processed
    return {"processed": processed, "failed": failed}
