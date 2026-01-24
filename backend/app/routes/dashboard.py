from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db import get_db
from app.models import Resolution, Plan, Checkin, Signal, MirrorReport, Feedback
from app.schemas import (
    DashboardResponse, MetricsResponse, ResolutionResponse, PlanResponse, 
    CheckinResponse, MirrorReportResponse, FeedbackCreate, ProgressSummaryResponse
)
from app.services.drift import compute_drift_score, get_weekly_frequency_stats
from app.services.plan_adjuster import compute_minimum_action_scaling
from app.services.progress_summary import generate_progress_summary

router = APIRouter()


def calculate_metrics(checkins, all_signals, target_frequency: int = 3):
    """Calculate all metrics including minimum action tracking and scaling."""
    total = len(checkins)
    
    # Get weekly frequency stats
    frequency_stats = get_weekly_frequency_stats(checkins, target_frequency)
    
    if total == 0:
        return MetricsResponse(
            completion_rate=0,
            streak=0,
            avg_friction=0,
            drift_score=0,
            total_checkins=0,
            minimum_action_streak=0,
            minimum_action_rate=0,
            this_week_count=0,
            target_frequency=target_frequency,
            suggest_momentum_minimum=False,
            momentum_suggestion_text=None,
            active_minimum_level="base"
        )
    
    completed_count = sum(1 for c in checkins if c.completed)
    completion_rate = completed_count / total
    
    # Calculate completion streak (backwards compat)
    streak = 0
    for c in checkins:
        if c.completed:
            streak += 1
        else:
            break
    
    # Calculate minimum action streak
    minimum_action_streak = 0
    for c in checkins:
        # Check did_minimum_action if available, fallback to completed
        did_min = getattr(c, 'did_minimum_action', None)
        if did_min is None:
            did_min = c.completed  # Backwards compat for old checkins
        if did_min:
            minimum_action_streak += 1
        else:
            break
    
    # Calculate minimum action rate
    min_action_count = sum(
        1 for c in checkins 
        if getattr(c, 'did_minimum_action', None) or c.completed
    )
    minimum_action_rate = min_action_count / total
    
    avg_friction = sum(c.friction for c in checkins) / total
    drift_score = compute_drift_score(checkins, all_signals, target_frequency)
    
    # Compute minimum action scaling
    suggest_momentum, suggestion_text = compute_minimum_action_scaling(
        minimum_action_streak,
        minimum_action_rate,
        avg_friction
    )
    
    # Determine active level based on current state
    # If rate is low or friction high, always show base
    if minimum_action_rate < 0.6 or avg_friction >= 3.0:
        active_level = "base"
    elif suggest_momentum:
        active_level = "momentum"
    else:
        active_level = "base"
    
    return MetricsResponse(
        completion_rate=round(completion_rate, 2),
        streak=streak,
        avg_friction=round(avg_friction, 2),
        drift_score=round(drift_score, 2),
        total_checkins=total,
        minimum_action_streak=minimum_action_streak,
        minimum_action_rate=round(minimum_action_rate, 2),
        this_week_count=frequency_stats["this_week_count"],
        target_frequency=target_frequency,
        suggest_momentum_minimum=suggest_momentum,
        momentum_suggestion_text=suggestion_text,
        active_minimum_level=active_level
    )


def _safe_checkin_response(checkin: Checkin) -> CheckinResponse:
    """Safely build a CheckinResponse, filling defaults for legacy rows."""
    try:
        return CheckinResponse.model_validate(checkin)
    except Exception:
        return CheckinResponse.model_validate({
            "id": checkin.id,
            "resolution_id": checkin.resolution_id,
            "planned": checkin.planned or "",
            "actual": checkin.actual or "",
            "blocker": checkin.blocker,
            "completed": bool(checkin.completed),
            "did_minimum_action": bool(checkin.did_minimum_action) if checkin.did_minimum_action is not None else bool(checkin.completed),
            "extra_done": checkin.extra_done,
            "friction": int(checkin.friction) if checkin.friction is not None else 2,
            "created_at": checkin.created_at,
        })


def _safe_mirror_response(mirror: MirrorReport | None) -> MirrorReportResponse | None:
    """Safely validate mirror report JSON; return None if invalid."""
    if not mirror:
        return None
    try:
        return MirrorReportResponse.model_validate(mirror)
    except Exception:
        return None

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
                total_checkins=0,
                minimum_action_streak=0,
                minimum_action_rate=0
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
    
    # Get target frequency
    target_frequency = current_plan.frequency_per_week if current_plan else resolution.frequency_per_week
    
    # Calculate metrics using helper
    metrics = calculate_metrics(checkins, all_signals, target_frequency)
    
    # Get latest mirror
    latest_mirror = db.query(MirrorReport).filter(
        MirrorReport.resolution_id == resolution.id
    ).order_by(MirrorReport.created_at.desc()).first()
    
    return DashboardResponse(
        resolution=ResolutionResponse.model_validate(resolution),
        current_plan=PlanResponse.model_validate(current_plan) if current_plan else None,
        recent_checkins=[_safe_checkin_response(c) for c in checkins],
        metrics=metrics,
        latest_mirror=_safe_mirror_response(latest_mirror),
        drift_triggered=metrics.drift_score > 0.4 and metrics.total_checkins >= 3
    )

@router.get("/{resolution_id}/", response_model=DashboardResponse)
async def get_dashboard_for_resolution(resolution_id: int, db: Session = Depends(get_db)):
    resolution = db.query(Resolution).filter(Resolution.id == resolution_id).first()
    if not resolution:
        raise HTTPException(status_code=404, detail="Resolution not found")
    
    current_plan = db.query(Plan).filter(
        Plan.resolution_id == resolution_id
    ).order_by(Plan.version.desc()).first()
    
    checkins = db.query(Checkin).filter(
        Checkin.resolution_id == resolution_id
    ).order_by(Checkin.created_at.desc()).limit(10).all()
    
    all_signals = db.query(Signal).join(Checkin).filter(
        Checkin.resolution_id == resolution_id
    ).all()
    
    # Get target frequency
    target_frequency = current_plan.frequency_per_week if current_plan else resolution.frequency_per_week
    
    # Calculate metrics using helper
    metrics = calculate_metrics(checkins, all_signals, target_frequency)
    
    latest_mirror = db.query(MirrorReport).filter(
        MirrorReport.resolution_id == resolution_id
    ).order_by(MirrorReport.created_at.desc()).first()
    
    return DashboardResponse(
        resolution=ResolutionResponse.model_validate(resolution),
        current_plan=PlanResponse.model_validate(current_plan) if current_plan else None,
        recent_checkins=[_safe_checkin_response(c) for c in checkins],
        metrics=metrics,
        latest_mirror=_safe_mirror_response(latest_mirror),
        drift_triggered=metrics.drift_score > 0.4 and metrics.total_checkins >= 3
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


@router.get("/{resolution_id}/summary/", response_model=ProgressSummaryResponse)
async def get_progress_summary(resolution_id: int, db: Session = Depends(get_db)):
    """
    Generate an AI-powered progress summary from check-in notes.
    Analyzes all 'extra_done' fields to show user their journey.
    """
    resolution = db.query(Resolution).filter(Resolution.id == resolution_id).first()
    if not resolution:
        raise HTTPException(status_code=404, detail="Resolution not found")
    
    # Get all checkins with notes
    checkins = db.query(Checkin).filter(
        Checkin.resolution_id == resolution_id
    ).order_by(Checkin.created_at.asc()).all()
    
    # Build notes timeline
    notes = []
    for c in checkins:
        if c.extra_done:
            notes.append({
                "date": c.created_at.strftime("%Y-%m-%d"),
                "note": c.extra_done,
                "did_minimum": c.did_minimum_action
            })
    
    # Calculate completion rate
    total = len(checkins)
    completed = sum(1 for c in checkins if c.completed or c.did_minimum_action)
    completion_rate = completed / total if total > 0 else 0
    
    # Generate summary
    summary = await generate_progress_summary(
        goal_title=resolution.title,
        goal_why=resolution.why,
        notes=notes,
        total_checkins=total,
        completion_rate=completion_rate,
        created_at=resolution.created_at
    )
    
    return ProgressSummaryResponse(
        overall_progress=summary.overall_progress,
        key_wins=summary.key_wins,
        growth_observed=summary.growth_observed,
        encouragement=summary.encouragement,
        days_to_habit=summary.days_to_habit
    )
