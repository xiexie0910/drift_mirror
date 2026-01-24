from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db import get_db
from app.models import Resolution, Plan, Checkin, Signal, MirrorReport
from app.schemas import CheckinCreate, CheckinResponse, SignalResponse, MirrorReportResponse, DebugPayload
from app.services.drift import compute_drift_score, should_trigger_mirror, get_drift_rules_applied, get_weekly_frequency_stats
from app.services.plan_adjuster import compute_plan_adjustment, create_new_plan_version
from app.services.llm_client import call_llm, extract_json_from_response
from app.services.prompts import SIGNAL_EXTRACTOR_SYSTEM, SIGNAL_EXTRACTOR_PROMPT, MIRROR_COMPOSER_SYSTEM, MIRROR_COMPOSER_PROMPT
from app.services.stubs import stub_extract_signals, stub_compose_mirror

router = APIRouter()

@router.post("/", response_model=dict)
async def create_checkin(data: CheckinCreate, db: Session = Depends(get_db)):
    # Verify resolution exists
    resolution = db.query(Resolution).filter(Resolution.id == data.resolution_id).first()
    if not resolution:
        raise HTTPException(status_code=404, detail="Resolution not found")
    
    # Build planned/actual from new fields
    # planned = minimum action text or fallback
    planned = resolution.minimum_action_text or f"{resolution.min_minutes} min on goal"
    
    # actual = what they did (minimum + extra if any)
    if data.did_minimum_action:
        actual = planned
        if data.extra_done:
            actual = f"{planned}. Also: {data.extra_done}"
    else:
        actual = data.blocker or "Did not do minimum action"
    
    # completed = True if they did minimum (for backwards compatibility)
    completed = data.did_minimum_action
    
    # Create checkin
    checkin = Checkin(
        resolution_id=data.resolution_id,
        planned=planned,
        actual=actual,
        blocker=data.blocker,
        completed=completed,
        did_minimum_action=data.did_minimum_action,
        extra_done=data.extra_done,
        friction=data.friction
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    
    # Extract signals (LLM or fallback)
    signals_data = await extract_signals(data, db, planned, actual, completed)
    
    # Store signals
    for sig in signals_data:
        signal = Signal(
            checkin_id=checkin.id,
            signal_type=sig["signal_type"],
            content=sig["content"],
            severity=sig.get("severity", 0.5)
        )
        db.add(signal)
    db.commit()
    
    # Get all checkins and signals for drift calculation
    all_checkins = db.query(Checkin).filter(
        Checkin.resolution_id == data.resolution_id
    ).order_by(Checkin.created_at.desc()).all()
    
    all_signals = db.query(Signal).join(Checkin).filter(
        Checkin.resolution_id == data.resolution_id
    ).all()
    
    # Get target frequency from plan or resolution
    current_plan = db.query(Plan).filter(
        Plan.resolution_id == data.resolution_id
    ).order_by(Plan.version.desc()).first()
    target_frequency = current_plan.frequency_per_week if current_plan else resolution.frequency_per_week
    
    # Get weekly frequency stats (how many check-ins this week)
    frequency_stats = get_weekly_frequency_stats(all_checkins, target_frequency)
    
    # Compute drift with frequency awareness
    drift_score = compute_drift_score(all_checkins, all_signals, target_frequency)
    rules_applied = get_drift_rules_applied(drift_score, all_checkins, target_frequency)
    
    # Check if mirror should trigger
    drift_triggered = should_trigger_mirror(drift_score, len(all_checkins))
    mirror_report = None
    plan_updated = False
    
    if drift_triggered:
        # Compose mirror report with frequency data
        mirror_data = await compose_mirror(resolution, all_signals, drift_score, db, all_checkins)
        
        # Store mirror report
        mirror = MirrorReport(
            resolution_id=data.resolution_id,
            findings=mirror_data["findings"],
            counterfactual=mirror_data.get("counterfactual"),
            drift_score=drift_score
        )
        db.add(mirror)
        db.commit()
        db.refresh(mirror)
        mirror_report = mirror
        
        # Compute plan adjustment
        current_plan = db.query(Plan).filter(
            Plan.resolution_id == data.resolution_id
        ).order_by(Plan.version.desc()).first()
        
        if current_plan:
            n = min(len(all_checkins), 10)
            recent = all_checkins[:n]
            avg_friction = sum(c.friction for c in recent) / n
            completion_rate = sum(1 for c in recent if c.completed) / n
            
            # Calculate minimum_action_rate for priority-based adjustment
            min_action_count = sum(
                1 for c in recent 
                if getattr(c, 'did_minimum_action', None) or c.completed
            )
            minimum_action_rate = min_action_count / n if n > 0 else 0
            
            changes, adjustment_reason = compute_plan_adjustment(
                current_plan, 
                drift_score, 
                avg_friction, 
                completion_rate,
                minimum_action_rate,
                recent
            )
            
            # Only create new plan for actual parameter changes (not simplify_minimum_action flag)
            param_changes = {k: v for k, v in changes.items() if k != "simplify_minimum_action"}
            if param_changes:
                create_new_plan_version(
                    data.resolution_id, current_plan, param_changes, adjustment_reason
                )
                plan_updated = True
    
    # Build debug payload
    stored_signals = db.query(Signal).filter(Signal.checkin_id == checkin.id).all()
    debug = DebugPayload(
        signals=[SignalResponse.model_validate(s) for s in stored_signals],
        rules_applied=rules_applied,
        raw_json={
            "drift_score": drift_score,
            "checkin_count": len(all_checkins),
            "drift_triggered": drift_triggered,
            "plan_updated": plan_updated
        }
    )
    
    return {
        "checkin": CheckinResponse.model_validate(checkin),
        "drift_score": drift_score,
        "drift_triggered": drift_triggered,
        "mirror_report": MirrorReportResponse.model_validate(mirror_report) if mirror_report else None,
        "plan_updated": plan_updated,
        "this_week_count": frequency_stats["this_week_count"],
        "target_frequency": frequency_stats["this_week_target"],
        "debug": debug
    }

async def extract_signals(
    data: CheckinCreate, 
    db: Session,
    planned: str,
    actual: str,
    completed: bool
) -> List[dict]:
    """Extract signals using LLM with fallback to stub."""
    prompt = SIGNAL_EXTRACTOR_PROMPT.format(
        did_minimum=data.did_minimum_action,
        extra_done=data.extra_done or "None",
        blocker=data.blocker or "None",
        friction=data.friction
    )
    
    response = await call_llm(prompt, SIGNAL_EXTRACTOR_SYSTEM)
    result = extract_json_from_response(response) if response else None
    
    if result and "signals" in result:
        return result["signals"][:3]
    
    # Fallback to stub
    return stub_extract_signals(
        planned=planned,
        actual=actual,
        blocker=data.blocker or "",
        completed=completed,
        friction=data.friction
    )

async def compose_mirror(
    resolution: Resolution, 
    signals: List[Signal], 
    drift_score: float, 
    db: Session,
    all_checkins: List[Checkin] = None
) -> dict:
    """Compose mirror report using LLM with fallback to stub."""
    # Get current plan
    plan = db.query(Plan).filter(
        Plan.resolution_id == resolution.id
    ).order_by(Plan.version.desc()).first()
    
    target_frequency = plan.frequency_per_week if plan else resolution.frequency_per_week
    
    # Get frequency stats for data-driven findings
    frequency_stats = get_weekly_frequency_stats(all_checkins or [], target_frequency)
    recent_checkins = (all_checkins or [])[:5]
    
    # Format signals for prompt
    signals_text = "\n".join([
        f"- [{s.signal_type}] {s.content} (severity: {s.severity})"
        for s in signals[-9:]  # Last 9 signals (3 checkins × 3 signals)
    ])
    
    prompt = MIRROR_COMPOSER_PROMPT.format(
        goal_title=resolution.title,
        goal_why=resolution.why or "Not specified",
        frequency=target_frequency,
        min_minutes=plan.min_minutes if plan else resolution.min_minutes,
        time_window=plan.time_window if plan else resolution.time_window,
        signals_text=signals_text,
        drift_score=drift_score
    )
    
    response = await call_llm(prompt, MIRROR_COMPOSER_SYSTEM)
    result = extract_json_from_response(response) if response else None
    
    if result and "findings" in result:
        return result
    
    # Fallback to stub with frequency stats
    signal_dicts = [{"signal_type": s.signal_type, "content": s.content, "severity": s.severity} for s in signals]
    return stub_compose_mirror(
        goal_title=resolution.title,
        goal_why=resolution.why or "",
        signals=signal_dicts,
        drift_score=drift_score,
        frequency_stats=frequency_stats,
        recent_checkins=recent_checkins
    )

@router.get("/{resolution_id}/", response_model=List[CheckinResponse])
async def get_checkins(resolution_id: int, db: Session = Depends(get_db)):
    return db.query(Checkin).filter(
        Checkin.resolution_id == resolution_id
    ).order_by(Checkin.created_at.desc()).all()
