from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
from uuid import UUID
from database import get_db
from models.lead import Lead, LeadEnrichment, LeadStatus
from models.user import User
from schemas import LeadCreate, LeadOut, LeadDetailOut, LeadStatusUpdate, LeadEmailUpdate, PipelineResponse
from services.pipeline import run_pipeline as _run_pipeline, enrich_lead
from services.gemini_service import generate_ai_summary
from routers.auth import get_current_user

router = APIRouter()


@router.get("", response_model=List[LeadOut])
def get_leads(
    status: Optional[LeadStatus] = Query(None),
    sort_by: Optional[str] = Query("created_at"),
    db: Session = Depends(get_db),
):
    q = db.query(Lead)
    if status:
        q = q.filter(Lead.status == status)
    if sort_by == "score":
        q = q.order_by(Lead.score.desc().nullslast())
    else:
        q = q.order_by(Lead.created_at.desc())
    return q.all()


@router.post("", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
def create_lead(payload: LeadCreate, db: Session = Depends(get_db)):
    lead = Lead(**payload.model_dump())
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return lead


@router.get("/{lead_id}", response_model=LeadDetailOut)
def get_lead(lead_id: UUID, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.patch("/{lead_id}/status", response_model=LeadOut)
def update_status(lead_id: UUID, payload: LeadStatusUpdate, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead.status = payload.status
    db.commit()
    db.refresh(lead)
    return lead


@router.patch("/{lead_id}/assign", response_model=LeadOut)
def assign_lead(lead_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    lead.status = LeadStatus.in_progress
    lead.assigned_to = current_user.id
    db.commit()
    db.refresh(lead)
    return lead


@router.patch("/{lead_id}/email", response_model=LeadOut)
def update_email(lead_id: UUID, payload: LeadEmailUpdate, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    enrichment = db.query(LeadEnrichment).filter(LeadEnrichment.lead_id == lead_id).first()
    if enrichment:
        enrichment.draft_email = payload.draft_email
        if payload.email_subject:
            enrichment.email_subject = payload.email_subject
    db.commit()
    db.refresh(lead)
    return lead


@router.post("/{lead_id}/analyze", response_model=LeadOut)
async def analyze_lead(lead_id: UUID, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    success = await enrich_lead(lead, db)
    if not success:
        raise HTTPException(status_code=500, detail="Enrichment pipeline failed")
    db.refresh(lead)
    return lead


@router.post("/{lead_id}/ai-summary")
async def ai_summary(lead_id: UUID, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    e = db.query(LeadEnrichment).filter(LeadEnrichment.lead_id == lead_id).first()
    if not e:
        raise HTTPException(status_code=400, detail="Lead has not been enriched yet")
    summary = await generate_ai_summary(
        company=lead.company,
        city=lead.city,
        state=lead.state,
        score=lead.score or 0,
        total_rental_units=e.total_rental_units,
        population_growth_5yr=e.population_growth_5yr,
        renter_ratio=e.renter_ratio,
        unemployment_rate=e.unemployment_rate,
        fmr_two_br=e.fmr_two_br,
        company_summary=e.company_summary or "",
        company_news_headlines=e.company_news_headlines or "",
        sales_insights=e.sales_insights or "",
    )
    e.ai_summary = summary
    db.commit()
    return {"summary": summary}


@router.delete("/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_lead(lead_id: UUID, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    enrichment = db.query(LeadEnrichment).filter(LeadEnrichment.lead_id == lead_id).first()
    if enrichment:
        db.delete(enrichment)
    db.delete(lead)
    db.commit()


@router.post("/run-pipeline", response_model=PipelineResponse)
async def run_pipeline(db: Session = Depends(get_db)):
    result = await _run_pipeline(db)
    return {
        "message": f"Pipeline complete. {result['processed']} processed, {result['failed']} failed.",
        "processed": result["processed"],
        "failed": result["failed"],
    }
