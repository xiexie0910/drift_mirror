from typing import Tuple
from app.models import Plan
from app.db import SessionLocal

def compute_plan_adjustment(
    current_plan: Plan,
    drift_score: float,
    avg_friction: float,
    completion_rate: float
) -> Tuple[dict, str]:
    """
    Deterministically compute plan adjustments based on drift signals.
    Returns (changes_dict, recovery_step)
    """
    changes = {}
    recovery_step = ""
    
    # Rule 1: Low completion + high drift -> reduce frequency
    if completion_rate < 0.5 and drift_score > 0.5:
        new_freq = max(1, current_plan.frequency_per_week - 1)
        if new_freq != current_plan.frequency_per_week:
            changes["frequency_per_week"] = new_freq
            recovery_step = "Try fewer sessions per week to build consistency first."
    
    # Rule 2: High friction -> reduce duration
    if avg_friction > 2.3:
        new_mins = max(5, current_plan.min_minutes - 5)
        if new_mins != current_plan.min_minutes:
            changes["min_minutes"] = new_mins
            recovery_step = recovery_step or "Shorter sessions can reduce resistance."
    
    # Rule 3: Moderate drift + decent completion -> suggest time shift
    if drift_score > 0.4 and completion_rate >= 0.5:
        time_windows = ["morning", "afternoon", "evening", "night"]
        current_idx = time_windows.index(current_plan.time_window) if current_plan.time_window in time_windows else 0
        next_idx = (current_idx + 1) % len(time_windows)
        changes["time_window"] = time_windows[next_idx]
        recovery_step = recovery_step or f"Consider shifting to {time_windows[next_idx]} when energy might be different."
    
    if not recovery_step:
        recovery_step = "Keep going—small adjustments compound over time."
    
    return changes, recovery_step

def create_new_plan_version(
    resolution_id: int,
    current_plan: Plan,
    changes: dict,
    recovery_step: str
) -> Plan:
    """Create a new plan version with the specified changes."""
    db = SessionLocal()
    try:
        new_plan = Plan(
            resolution_id=resolution_id,
            version=current_plan.version + 1,
            frequency_per_week=changes.get("frequency_per_week", current_plan.frequency_per_week),
            min_minutes=changes.get("min_minutes", current_plan.min_minutes),
            time_window=changes.get("time_window", current_plan.time_window),
            recovery_step=recovery_step
        )
        db.add(new_plan)
        db.commit()
        db.refresh(new_plan)
        return new_plan
    finally:
        db.close()
