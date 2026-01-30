from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Resolution, Plan, Checkin, Signal, MirrorReport, InsightAction
from app.schemas import ResolutionCreate, ResolutionResponse, PlanResponse, InsightActionCreate, InsightActionResponse

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
        minimum_action_text=data.minimum_action_text
    )
    db.add(resolution)
    db.commit()
    db.refresh(resolution)
    
    # Create initial plan (version 1)
    plan = Plan(
        resolution_id=resolution.id,
        version=1,
        frequency_per_week=data.frequency_per_week,
        min_minutes=data.min_minutes
    )
    db.add(plan)
    db.commit()
    
    return resolution

@router.get("/", response_model=list[ResolutionResponse])
async def get_resolutions(db: Session = Depends(get_db)):
    return db.query(Resolution).all()

@router.get("/{resolution_id}/", response_model=ResolutionResponse)
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

@router.post("/{resolution_id}/revert-plan")
async def revert_to_original_plan(resolution_id: int, db: Session = Depends(get_db)):
    """
    Revert the plan to the original resolution values.
    Creates a new plan version with the resolution's original settings.
    """
    resolution = db.query(Resolution).filter(Resolution.id == resolution_id).first()
    if not resolution:
        raise HTTPException(status_code=404, detail="Resolution not found")
    
    current_plan = db.query(Plan).filter(
        Plan.resolution_id == resolution_id
    ).order_by(Plan.version.desc()).first()
    
    if not current_plan:
        raise HTTPException(status_code=404, detail="No plan found")
    
    # Create new plan version with original resolution values
    new_plan = Plan(
        resolution_id=resolution_id,
        version=current_plan.version + 1,
        frequency_per_week=resolution.frequency_per_week,
        min_minutes=resolution.min_minutes,
        recovery_step=None
    )
    db.add(new_plan)
    db.commit()
    db.refresh(new_plan)
    
    return {"message": "Plan reverted to original", "version": new_plan.version}

@router.post("/{resolution_id}/insights/actions", response_model=InsightActionResponse)
async def create_insight_action(
    resolution_id: int, 
    data: InsightActionCreate, 
    db: Session = Depends(get_db)
):
    """
    Handle user action on a detected pattern/insight.
    Actions: adopt (apply suggestion), constrain (add a constraint), ignore (dismiss).
    """
    # Verify resolution exists
    resolution = db.query(Resolution).filter(Resolution.id == resolution_id).first()
    if not resolution:
        raise HTTPException(status_code=404, detail="Resolution not found")
    
    # Verify mirror report exists if provided
    if data.mirror_report_id:
        mirror = db.query(MirrorReport).filter(MirrorReport.id == data.mirror_report_id).first()
        if not mirror:
            raise HTTPException(status_code=404, detail="Mirror report not found")
    
    # Create insight action record
    insight_action = InsightAction(
        resolution_id=resolution_id,
        mirror_report_id=data.mirror_report_id,
        insight_type=data.insight_type,
        insight_summary=data.insight_summary,
        action_taken=data.action_taken,
        constraint_details=data.constraint_details,
        suggested_changes=data.suggested_changes
    )
    db.add(insight_action)
    db.commit()
    db.refresh(insight_action)
    
    # If action is "accept", apply the suggested changes to create a new plan version
    if data.action_taken == "accept" and data.suggested_changes:
        current_plan = db.query(Plan).filter(
            Plan.resolution_id == resolution_id
        ).order_by(Plan.version.desc()).first()
        
        if current_plan:
            new_version = current_plan.version + 1
            new_plan = Plan(
                resolution_id=resolution_id,
                version=new_version,
                frequency_per_week=data.suggested_changes.get('frequency_per_week', current_plan.frequency_per_week),
                min_minutes=data.suggested_changes.get('min_minutes', current_plan.min_minutes),
                recovery_step=f"Accepted: {data.insight_summary}"
            )
            db.add(new_plan)
            db.commit()
    
    return insight_action

@router.get("/{resolution_id}/insights/actions", response_model=list[InsightActionResponse])
async def get_insight_actions(resolution_id: int, db: Session = Depends(get_db)):
    """
    Get all insight actions for a resolution.
    Useful for understanding user preferences and avoiding repeated suggestions.
    """
    return db.query(InsightAction).filter(
        InsightAction.resolution_id == resolution_id
    ).order_by(InsightAction.created_at.desc()).all()

@router.patch("/{resolution_id}/minimum-action")
async def update_minimum_action(resolution_id: int, data: dict, db: Session = Depends(get_db)):
    """Update the minimum action text for a resolution."""
    resolution = db.query(Resolution).filter(Resolution.id == resolution_id).first()
    if not resolution:
        raise HTTPException(status_code=404, detail="Resolution not found")
    
    minimum_action_text = data.get('minimum_action_text', '').strip()
    if not minimum_action_text:
        raise HTTPException(status_code=400, detail="Minimum action text cannot be empty")
    
    resolution.minimum_action_text = minimum_action_text
    db.commit()
    db.refresh(resolution)
    
    return {"message": "Minimum action updated", "minimum_action_text": resolution.minimum_action_text}

@router.delete("/{resolution_id}/")
async def delete_resolution(resolution_id: int, db: Session = Depends(get_db)):
    resolution = db.query(Resolution).filter(Resolution.id == resolution_id).first()
    if not resolution:
        raise HTTPException(status_code=404, detail="Resolution not found")
    
    # Delete related records (cascading)
    # Delete signals via checkins
    checkin_ids = [c.id for c in db.query(Checkin).filter(Checkin.resolution_id == resolution_id).all()]
    if checkin_ids:
        db.query(Signal).filter(Signal.checkin_id.in_(checkin_ids)).delete(synchronize_session=False)
    
    # Delete checkins
    db.query(Checkin).filter(Checkin.resolution_id == resolution_id).delete(synchronize_session=False)
    
    # Delete mirror reports
    db.query(MirrorReport).filter(MirrorReport.resolution_id == resolution_id).delete(synchronize_session=False)
    
    # Delete plans
    db.query(Plan).filter(Plan.resolution_id == resolution_id).delete(synchronize_session=False)
    
    # Delete resolution
    db.delete(resolution)
    db.commit()
    
    return {"status": "deleted", "id": resolution_id}
