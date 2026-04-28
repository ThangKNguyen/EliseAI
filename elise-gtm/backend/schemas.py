from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from models.lead import LeadStatus


# --- Auth ---

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: UUID
    email: EmailStr
    first_name: str
    last_name: str
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str


# --- Leads ---

class LeadCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    company: str
    property_address: str
    city: str
    state: str

class LeadOut(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    email: EmailStr
    company: str
    property_address: str
    city: str
    state: str
    status: LeadStatus
    assigned_to: Optional[UUID]
    assigned_user_name: Optional[str]
    score: Optional[int]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class LeadStatusUpdate(BaseModel):
    status: LeadStatus

class LeadEmailUpdate(BaseModel):
    draft_email: str
    email_subject: Optional[str]


# --- Enrichment ---

class LeadEnrichmentOut(BaseModel):
    # Census
    total_rental_units: Optional[int]
    population: Optional[int]
    population_growth_5yr: Optional[float]
    median_income: Optional[int]
    renter_ratio: Optional[float]
    # FRED
    unemployment_rate: Optional[float]
    gdp_growth_rate: Optional[float]
    housing_price_trend: Optional[str]
    # WalkScore (via Tavily)
    walk_score: Optional[int]
    # Tavily
    company_summary: Optional[str]
    market_news: Optional[str]
    # NewsAPI
    company_news_headlines: Optional[str]
    city_rental_news: Optional[str]
    # Wikipedia
    city_overview: Optional[str]
    # HUD
    fmr_one_br: Optional[float]
    fmr_two_br: Optional[float]
    fmr_three_br: Optional[float]
    # OpenCorporates
    company_status: Optional[str]
    company_incorporated: Optional[str]
    company_jurisdiction: Optional[str]
    company_type: Optional[str]
    # Gemini
    sales_insights: Optional[str]
    talk_track: Optional[str]
    draft_email: Optional[str]
    email_subject: Optional[str]
    ai_summary: Optional[str]

    class Config:
        from_attributes = True

class LeadDetailOut(LeadOut):
    enrichment: Optional[LeadEnrichmentOut]


# --- Pipeline ---

class PipelineResponse(BaseModel):
    message: str
    processed: int
    failed: int
