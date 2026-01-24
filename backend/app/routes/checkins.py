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

router = APIRouter()

def generate_actionable_suggestions(
    checkins: List[Checkin], 
    current_plan: Plan, 
    drift_score: float,
    frequency_stats: dict
) -> List[dict]:
    """
    Generate actionable suggestions based on drift patterns.
    Returns a list of suggestions with type, message, and suggested changes.
    """
    suggestions = []
    
    if not checkins or not current_plan:
        return suggestions
    
    recent = checkins[:5]
    n = len(recent)
    
    # Calculate metrics
    avg_friction = sum(c.friction for c in recent) / n
    completion_rate = sum(1 for c in recent if c.did_minimum_action) / n
    missed_count = sum(1 for c in recent if not c.did_minimum_action)
    
    # Suggestion 1: High friction → reduce duration
    if avg_friction >= 2.5:
        new_mins = max(5, current_plan.min_minutes - 5)
        suggestions.append({
            "type": "reduce_duration",
            "suggestion": f"Your sessions feel harder than they should. Try reducing from {current_plan.min_minutes} to {new_mins} minutes to build momentum.",
            "changes": {"min_minutes": new_mins},
            "reason": f"Average friction is {avg_friction:.1f}/3.0"
        })
    
    # Suggestion 2: Low completion → simplify minimum action
    if completion_rate < 0.5 and n >= 3:
        suggestions.append({
            "type": "simplify_action",
            "suggestion": "The minimum action might be too ambitious. Consider breaking it into an even smaller step you can do on difficult days.",
            "changes": {},  # This requires manual adjustment
            "reason": f"Only {int(completion_rate * 100)}% completion rate"
        })
    
    # Suggestion 3: Below weekly target → adjust frequency
    if frequency_stats.get('this_week_rate', 0) < 0.6 and frequency_stats.get('trend') == 'declining':
        new_freq = max(1, current_plan.frequency_per_week - 1)
        suggestions.append({
            "type": "reduce_frequency",
            "suggestion": f"You're hitting {frequency_stats['this_week_count']}/{frequency_stats['this_week_target']} check-ins this week. Adjusting to {new_freq}x per week might feel more sustainable.",
            "changes": {"frequency_per_week": new_freq},
            "reason": f"Weekly rate: {int(frequency_stats['this_week_rate'] * 100)}%"
        })
    
    # Suggestion 4: Pattern of misses → try different time
    if missed_count >= 2:
        time_options = ["morning", "afternoon", "evening", "night"]
        current_idx = time_options.index(current_plan.time_window) if current_plan.time_window in time_options else 0
        next_time = time_options[(current_idx + 1) % len(time_options)]
        suggestions.append({
            "type": "change_time",
            "suggestion": f"You've missed {missed_count} of your last {n} attempts. Would trying {next_time} instead of {current_plan.time_window} work better with your schedule?",
            "changes": {"time_window": next_time},
            "reason": f"{missed_count}/{n} recent misses"
        })
    
    # Suggestion 5: High drift + high friction → recovery mode
    if drift_score > 0.6 and avg_friction >= 2.5:
        suggestions.append({
            "type": "recovery_mode",
            "suggestion": "The plan feels out of sync with your reality right now. Take a week to just show up—no pressure on duration or quality. We'll rebuild from there.",
            "changes": {
                "min_minutes": 5,
                "frequency_per_week": max(1, current_plan.frequency_per_week - 1)
            },
            "reason": f"High drift ({drift_score:.1f}) + high friction ({avg_friction:.1f})"
        })
    
    return suggestions[:3]  # Return top 3 suggestions

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
        
        # Generate actionable suggestions based on drift patterns
        actionable_suggestions = generate_actionable_suggestions(
            all_checkins, current_plan if current_plan else None, drift_score, frequency_stats
        )
        
        # Store mirror report
        mirror = MirrorReport(
            resolution_id=data.resolution_id,
            findings=mirror_data["findings"],
            counterfactual=mirror_data.get("counterfactual"),
            drift_score=drift_score,
            actionable_suggestions=actionable_suggestions
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
            
            # Compute what changes would be suggested (no longer auto-applied)
            # User must now explicitly accept suggestions via the Insight Action system
            changes, adjustment_reason = compute_plan_adjustment(
                current_plan, 
                drift_score, 
                avg_friction, 
                completion_rate,
                minimum_action_rate,
                recent
            )
            
            # DISABLED: Auto-apply removed - user must accept suggestions via InsightCard
            # Only create new plan for actual parameter changes (not simplify_minimum_action flag)
            # param_changes = {k: v for k, v in changes.items() if k != "simplify_minimum_action"}
            # if param_changes:
            #     create_new_plan_version(
            #         data.resolution_id, current_plan, param_changes, adjustment_reason
            #     )
            #     plan_updated = True
    
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
    result = extract_json_from_response(response)
    
    if result and "signals" in result:
        return result["signals"][:3]
    
    raise HTTPException(status_code=502, detail="Gemini failed to extract signals")

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
    result = extract_json_from_response(response)
    
    if result and "findings" in result:
        return result
    
    raise HTTPException(status_code=502, detail="Gemini failed to compose mirror report")

@router.get("/{resolution_id}/", response_model=List[CheckinResponse])
async def get_checkins(resolution_id: int, db: Session = Depends(get_db)):
    return db.query(Checkin).filter(
        Checkin.resolution_id == resolution_id
    ).order_by(Checkin.created_at.desc()).all()
