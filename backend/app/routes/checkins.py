from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db import get_db
from app.models import Resolution, Plan, Checkin, Signal, MirrorReport
from app.schemas import CheckinCreate, CheckinResponse, SignalResponse, MirrorReportResponse, DebugPayload
from app.services.drift import compute_drift_score, should_trigger_mirror, get_drift_rules_applied
from app.services.plan_adjuster import compute_plan_adjustment, create_new_plan_version
from app.services.llm_client import call_ollama, extract_json_from_response
from app.services.prompts import SIGNAL_EXTRACTOR_SYSTEM, SIGNAL_EXTRACTOR_PROMPT, MIRROR_COMPOSER_SYSTEM, MIRROR_COMPOSER_PROMPT
from app.services.stubs import stub_extract_signals, stub_compose_mirror

router = APIRouter()

@router.post("/", response_model=dict)
async def create_checkin(data: CheckinCreate, db: Session = Depends(get_db)):
    # Verify resolution exists
    resolution = db.query(Resolution).filter(Resolution.id == data.resolution_id).first()
    if not resolution:
        raise HTTPException(status_code=404, detail="Resolution not found")
    
    # Create checkin
    checkin = Checkin(
        resolution_id=data.resolution_id,
        planned=data.planned,
        actual=data.actual,
        blocker=data.blocker,
        completed=data.completed,
        friction=data.friction
    )
    db.add(checkin)
    db.commit()
    db.refresh(checkin)
    
    # Extract signals (LLM or fallback)
    signals_data = await extract_signals(data, db)
    
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
    
    # Compute drift
    drift_score = compute_drift_score(all_checkins, all_signals)
    rules_applied = get_drift_rules_applied(drift_score, all_checkins)
    
    # Check if mirror should trigger
    drift_triggered = should_trigger_mirror(drift_score, len(all_checkins))
    mirror_report = None
    plan_updated = False
    
    if drift_triggered:
        # Compose mirror report
        mirror_data = await compose_mirror(resolution, all_signals, drift_score, db)
        
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
            n = min(len(all_checkins), 3)
            recent = all_checkins[:n]
            avg_friction = sum(c.friction for c in recent) / n
            completion_rate = sum(1 for c in recent if c.completed) / n
            
            changes, recovery_step = compute_plan_adjustment(
                current_plan, drift_score, avg_friction, completion_rate
            )
            
            if changes:
                # Create new plan version (result not needed, just need to create it)
                create_new_plan_version(
                    data.resolution_id, current_plan, changes, recovery_step
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
        "debug": debug
    }

async def extract_signals(data: CheckinCreate, db: Session) -> List[dict]:
    """Extract signals using LLM with fallback to stub."""
    prompt = SIGNAL_EXTRACTOR_PROMPT.format(
        planned=data.planned,
        actual=data.actual,
        blocker=data.blocker or "None",
        completed=data.completed,
        friction=data.friction
    )
    
    response = await call_ollama(prompt, SIGNAL_EXTRACTOR_SYSTEM)
    result = extract_json_from_response(response) if response else None
    
    if result and "signals" in result:
        return result["signals"][:3]
    
    # Fallback to stub
    return stub_extract_signals(
        data.planned, data.actual, data.blocker or "",
        data.completed, data.friction
    )

async def compose_mirror(resolution: Resolution, signals: List[Signal], drift_score: float, db: Session) -> dict:
    """Compose mirror report using LLM with fallback to stub."""
    # Get current plan
    plan = db.query(Plan).filter(
        Plan.resolution_id == resolution.id
    ).order_by(Plan.version.desc()).first()
    
    # Format signals for prompt
    signals_text = "\n".join([
        f"- [{s.signal_type}] {s.content} (severity: {s.severity})"
        for s in signals[-9:]  # Last 9 signals (3 checkins × 3 signals)
    ])
    
    prompt = MIRROR_COMPOSER_PROMPT.format(
        goal_title=resolution.title,
        goal_why=resolution.why or "Not specified",
        frequency=plan.frequency_per_week if plan else resolution.frequency_per_week,
        min_minutes=plan.min_minutes if plan else resolution.min_minutes,
        time_window=plan.time_window if plan else resolution.time_window,
        signals_text=signals_text,
        drift_score=drift_score
    )
    
    response = await call_ollama(prompt, MIRROR_COMPOSER_SYSTEM)
    result = extract_json_from_response(response) if response else None
    
    if result and "findings" in result:
        return result
    
    # Fallback to stub
    signal_dicts = [{"signal_type": s.signal_type, "content": s.content, "severity": s.severity} for s in signals]
    return stub_compose_mirror(
        resolution.title,
        resolution.why or "",
        signal_dicts,
        drift_score
    )

@router.get("/{resolution_id}/", response_model=List[CheckinResponse])
async def get_checkins(resolution_id: int, db: Session = Depends(get_db)):
    return db.query(Checkin).filter(
        Checkin.resolution_id == resolution_id
    ).order_by(Checkin.created_at.desc()).all()
