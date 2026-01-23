from typing import Tuple, List, Optional
from app.models import Plan, Checkin
from app.db import SessionLocal

# ============================================================
# Minimum Action Scaling
# ============================================================

def compute_minimum_action_scaling(
    minimum_action_streak: int,
    minimum_action_rate: float,
    avg_friction: float
) -> Tuple[bool, Optional[str]]:
    """
    Determine if user should be offered a Momentum Minimum.
    
    Returns:
        (suggest_momentum, suggestion_text)
    
    Trigger momentum when ALL are true:
        - minimum_action_streak >= 5
        - minimum_action_rate >= 0.8
        - avg_friction <= 2.0
    
    If later:
        - minimum_action_rate drops < 0.6 OR friction >= 3
        → Automatically revert emphasis to Base Minimum
    """
    # Check if should suggest momentum minimum
    if (minimum_action_streak >= 5 and 
        minimum_action_rate >= 0.8 and 
        avg_friction <= 2.0):
        return True, "You've been consistent. Consider adding a bit more."
    
    # Check if should revert to base (for active momentum users)
    if minimum_action_rate < 0.6 or avg_friction >= 3.0:
        return False, None
    
    return False, None


def compute_plan_adjustment(
    current_plan: Plan,
    drift_score: float,
    avg_friction: float,
    completion_rate: float,
    minimum_action_rate: float,
    recent_checkins: List[Checkin]
) -> Tuple[dict, str]:
    """
    Deterministically compute plan adjustments based on drift signals.
    
    NEW PRIORITY ORDER (per spec):
    1. Minimum Action (if minimum_action_rate < 0.6)
    2. Duration (if avg_friction >= 2.5)
    3. Time Window (if misses cluster around same time)
    4. Frequency (last resort)
    
    Returns (changes_dict, adjustment_reason)
    
    Philosophy:
    - Never use "reduced", "downgraded", "failed", "underperformed"
    - Frame as expectation alignment, not correction
    """
    changes = {}
    adjustment_reason = ""
    
    # Only adjust if drift is significant AND we have enough data
    # Threshold 0.3: Catches moderate struggles early without being oversensitive
    # Requires 3+ checkins to avoid premature adjustments
    if drift_score <= 0.3 or len(recent_checkins) < 3:
        return changes, "Keep going—small steps compound over time."
    
    # ============================================================
    # PRIORITY 1: Minimum Action (behavioral, not scheduling)
    # ============================================================
    if minimum_action_rate < 0.6:
        # Don't change plan parameters - flag for minimum action simplification
        changes["simplify_minimum_action"] = True
        adjustment_reason = (
            "We noticed the starting point might need adjustment. "
            "The current minimum action may be too ambitious for difficult days. "
            "Consider an even smaller first step."
        )
        return changes, adjustment_reason
    
    # ============================================================
    # PRIORITY 2: Duration (friction-based)
    # ============================================================
    if avg_friction >= 2.5:
        new_mins = max(5, current_plan.min_minutes - 5)
        if new_mins != current_plan.min_minutes:
            changes["min_minutes"] = new_mins
            adjustment_reason = (
                f"We adjusted the session length to {new_mins} minutes. "
                "This plan was slightly too heavy for your current rhythm. "
                "Nothing is wrong—the plan just needs to match reality better."
            )
            return changes, adjustment_reason
    
    # ============================================================
    # PRIORITY 3: Time Window (pattern-based)
    # ============================================================
    # Check if misses cluster around same time window
    if len(recent_checkins) >= 3:
        missed_checkins = [c for c in recent_checkins if not c.did_minimum_action]
        if len(missed_checkins) >= 2:
            # Suggest time shift
            time_windows = ["morning", "afternoon", "evening", "night"]
            current_idx = time_windows.index(current_plan.time_window) if current_plan.time_window in time_windows else 0
            next_idx = (current_idx + 1) % len(time_windows)
            new_window = time_windows[next_idx]
            changes["time_window"] = new_window
            adjustment_reason = (
                f"We shifted the suggested time to {new_window}. "
                "The previous time slot may not have been fitting your energy levels. "
                "This is an experiment, not a judgment."
            )
            return changes, adjustment_reason
    
    # ============================================================
    # PRIORITY 4: Frequency (LAST RESORT)
    # ============================================================
    if completion_rate < 0.5:
        new_freq = max(1, current_plan.frequency_per_week - 1)
        if new_freq != current_plan.frequency_per_week:
            changes["frequency_per_week"] = new_freq
            adjustment_reason = (
                f"We adjusted the expectation to {new_freq}x per week. "
                "This isn't about doing less—it's about finding a sustainable rhythm. "
                "Once this feels natural, we can explore more."
            )
            return changes, adjustment_reason
    
    # No changes needed
    return {}, "Keep going—small steps compound over time."


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
