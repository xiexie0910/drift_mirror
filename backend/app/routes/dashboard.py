from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Resolution, Plan, Checkin, Signal, MirrorReport, Feedback
from app.schemas import DashboardResponse, MetricsResponse, ResolutionResponse, PlanResponse, CheckinResponse, MirrorReportResponse, FeedbackCreate
from app.services.drift import compute_drift_score

router = APIRouter()

@router.get("/", response_model=DashboardResponse)
async def get_dashboard(db: Session = Depends(get_db)):
    # Get latest resolution
    resolution = db.query(Resolution).order_by(Resolution.created_at.desc()).first()
    
    if not resolution:
        return DashboardResponse(
            resolution=None,
            current_plan=None,
            recent_checkins=[],
            metrics=MetricsResponse(
                completion_rate=0,
                streak=0,
                avg_friction=0,
                drift_score=0,
                total_checkins=0
            ),
            latest_mirror=None,
            drift_triggered=False
        )
    
    # Get current plan
    current_plan = db.query(Plan).filter(
        Plan.resolution_id == resolution.id
    ).order_by(Plan.version.desc()).first()
    
    # Get recent checkins
    checkins = db.query(Checkin).filter(
        Checkin.resolution_id == resolution.id
    ).order_by(Checkin.created_at.desc()).limit(10).all()
    
    # Get all signals for drift calculation
    all_signals = db.query(Signal).join(Checkin).filter(
        Checkin.resolution_id == resolution.id
    ).all()
    
    # Calculate metrics
    total = len(checkins)
    completed_count = sum(1 for c in checkins if c.completed)
    completion_rate = completed_count / total if total > 0 else 0
    
    # Calculate streak
    streak = 0
    for c in checkins:
        if c.completed:
            streak += 1
        else:
            break
    
    # Calculate avg friction
    avg_friction = sum(c.friction for c in checkins) / total if total > 0 else 0
    
    # Calculate drift
    drift_score = compute_drift_score(checkins, all_signals)
    
    # Get latest mirror
    latest_mirror = db.query(MirrorReport).filter(
        MirrorReport.resolution_id == resolution.id
    ).order_by(MirrorReport.created_at.desc()).first()
    
    return DashboardResponse(
        resolution=ResolutionResponse.model_validate(resolution),
        current_plan=PlanResponse.model_validate(current_plan) if current_plan else None,
        recent_checkins=[CheckinResponse.model_validate(c) for c in checkins],
        metrics=MetricsResponse(
            completion_rate=round(completion_rate, 2),
            streak=streak,
            avg_friction=round(avg_friction, 2),
            drift_score=round(drift_score, 2),
            total_checkins=total
        ),
        latest_mirror=MirrorReportResponse.model_validate(latest_mirror) if latest_mirror else None,
        drift_triggered=drift_score > 0.4 and total >= 3
    )

@router.get("/{resolution_id}/", response_model=DashboardResponse)
async def get_dashboard_for_resolution(resolution_id: int, db: Session = Depends(get_db)):
    resolution = db.query(Resolution).filter(Resolution.id == resolution_id).first()
    if not resolution:
        raise HTTPException(status_code=404, detail="Resolution not found")
    
    # Same logic as above but for specific resolution
    current_plan = db.query(Plan).filter(
        Plan.resolution_id == resolution_id
    ).order_by(Plan.version.desc()).first()
    
    checkins = db.query(Checkin).filter(
        Checkin.resolution_id == resolution_id
    ).order_by(Checkin.created_at.desc()).limit(10).all()
    
    all_signals = db.query(Signal).join(Checkin).filter(
        Checkin.resolution_id == resolution_id
    ).all()
    
    total = len(checkins)
    completed_count = sum(1 for c in checkins if c.completed)
    completion_rate = completed_count / total if total > 0 else 0
    
    streak = 0
    for c in checkins:
        if c.completed:
            streak += 1
        else:
            break
    
    avg_friction = sum(c.friction for c in checkins) / total if total > 0 else 0
    drift_score = compute_drift_score(checkins, all_signals)
    
    latest_mirror = db.query(MirrorReport).filter(
        MirrorReport.resolution_id == resolution_id
    ).order_by(MirrorReport.created_at.desc()).first()
    
    return DashboardResponse(
        resolution=ResolutionResponse.model_validate(resolution),
        current_plan=PlanResponse.model_validate(current_plan) if current_plan else None,
        recent_checkins=[CheckinResponse.model_validate(c) for c in checkins],
        metrics=MetricsResponse(
            completion_rate=round(completion_rate, 2),
            streak=streak,
            avg_friction=round(avg_friction, 2),
            drift_score=round(drift_score, 2),
            total_checkins=total
        ),
        latest_mirror=MirrorReportResponse.model_validate(latest_mirror) if latest_mirror else None,
        drift_triggered=drift_score > 0.4 and total >= 3
    )

@router.post("/feedback/")
async def submit_feedback(data: FeedbackCreate, db: Session = Depends(get_db)):
    feedback = Feedback(
        mirror_report_id=data.mirror_report_id,
        helpful=data.helpful
    )
    db.add(feedback)
    db.commit()
    return {"status": "ok"}
