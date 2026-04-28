import uuid
import enum
from sqlalchemy import Column, String, Integer, Float, Text, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class LeadStatus(str, enum.Enum):
    pending = "pending"
    processed = "processed"
    in_progress = "in_progress"
    completed = "completed"


class Lead(Base):
    __tablename__ = "leads"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    company = Column(String, nullable=False)
    property_address = Column(String, nullable=False)
    city = Column(String, nullable=False)
    state = Column(String, nullable=False)
    status = Column(Enum(LeadStatus), default=LeadStatus.pending, nullable=False)
    assigned_to = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    score = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    assigned_user = relationship("User", back_populates="leads", foreign_keys=[assigned_to])
    enrichment = relationship("LeadEnrichment", back_populates="lead", uselist=False)

    @property
    def assigned_user_name(self):
        if self.assigned_user:
            return f"{self.assigned_user.first_name} {self.assigned_user.last_name}"
        return None


class LeadEnrichment(Base):
    __tablename__ = "lead_enrichments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lead_id = Column(UUID(as_uuid=True), ForeignKey("leads.id"), nullable=False, unique=True)

    # Census
    total_rental_units = Column(Integer, nullable=True)
    population = Column(Integer, nullable=True)
    population_growth_5yr = Column(Float, nullable=True)
    median_income = Column(Integer, nullable=True)
    renter_ratio = Column(Float, nullable=True)

    # FRED
    unemployment_rate = Column(Float, nullable=True)
    gdp_growth_rate = Column(Float, nullable=True)
    housing_price_trend = Column(String, nullable=True)

    # WalkScore (via Tavily)
    walk_score = Column(Integer, nullable=True)

    # Tavily
    company_summary = Column(Text, nullable=True)
    market_news = Column(Text, nullable=True)

    # NewsAPI
    company_news_headlines = Column(Text, nullable=True)   # JSON string
    city_rental_news = Column(Text, nullable=True)         # JSON string

    # Wikipedia
    city_overview = Column(Text, nullable=True)

    # HUD Fair Market Rents
    fmr_one_br = Column(Float, nullable=True)
    fmr_two_br = Column(Float, nullable=True)
    fmr_three_br = Column(Float, nullable=True)

    # OpenCorporates
    company_status = Column(String, nullable=True)
    company_incorporated = Column(String, nullable=True)
    company_jurisdiction = Column(String, nullable=True)
    company_type = Column(String, nullable=True)

    # Gemini generated
    sales_insights = Column(Text, nullable=True)           # JSON string
    talk_track = Column(Text, nullable=True)               # JSON string (list of 3 bullets)
    draft_email = Column(Text, nullable=True)
    email_subject = Column(String, nullable=True)
    ai_summary = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    lead = relationship("Lead", back_populates="enrichment")
