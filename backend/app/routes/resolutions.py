from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Resolution, Plan
from app.schemas import ResolutionCreate, ResolutionResponse, PlanResponse

router = APIRouter()

@router.post("/", response_model=ResolutionResponse)
async def create_resolution(data: ResolutionCreate, db: Session = Depends(get_db)):
    # Create resolution
    resolution = Resolution(
        title=data.title,
        why=data.why,
        mode=data.mode,
        frequency_per_week=data.frequency_per_week,
        min_minutes=data.min_minutes,
        time_window=data.time_window
    )
    db.add(resolution)
    db.commit()
    db.refresh(resolution)
    
    # Create initial plan (version 1)
    plan = Plan(
        resolution_id=resolution.id,
        version=1,
        frequency_per_week=data.frequency_per_week,
        min_minutes=data.min_minutes,
        time_window=data.time_window
    )
    db.add(plan)
    db.commit()
    
    return resolution

@router.get("/", response_model=list[ResolutionResponse])
async def get_resolutions(db: Session = Depends(get_db)):
    return db.query(Resolution).all()

@router.get("/{resolution_id}", response_model=ResolutionResponse)
async def get_resolution(resolution_id: int, db: Session = Depends(get_db)):
    resolution = db.query(Resolution).filter(Resolution.id == resolution_id).first()
    if not resolution:
        raise HTTPException(status_code=404, detail="Resolution not found")
    return resolution

@router.get("/{resolution_id}/plans", response_model=list[PlanResponse])
async def get_plans(resolution_id: int, db: Session = Depends(get_db)):
    return db.query(Plan).filter(Plan.resolution_id == resolution_id).order_by(Plan.version.desc()).all()

@router.get("/{resolution_id}/current-plan", response_model=PlanResponse)
async def get_current_plan(resolution_id: int, db: Session = Depends(get_db)):
    plan = db.query(Plan).filter(Plan.resolution_id == resolution_id).order_by(Plan.version.desc()).first()
    if not plan:
        raise HTTPException(status_code=404, detail="No plan found")
    return plan
