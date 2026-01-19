from typing import List
from app.models import Checkin, Signal

def compute_drift_score(checkins: List[Checkin], signals: List[Signal]) -> float:
    """
    Compute drift score (0-1) based on last N checkins.
    Higher = more drift from plan.
    """
    if not checkins:
        return 0.0
    
    n = min(len(checkins), 3)
    recent = checkins[:n]
    
    # Factors: completion rate, friction, blockers, signal severity
    completion_score = sum(1 for c in recent if c.completed) / n
    avg_friction = sum(c.friction for c in recent) / n
    blocker_count = sum(1 for c in recent if c.blocker)
    
    # Signal severity
    recent_ids = {c.id for c in recent}
    relevant_signals = [s for s in signals if s.checkin_id in recent_ids]
    avg_severity = sum(s.severity for s in relevant_signals) / len(relevant_signals) if relevant_signals else 0
    
    # Weighted drift: low completion, high friction, blockers, signal severity
    drift = (
        (1 - completion_score) * 0.4 +
        (avg_friction - 1) / 2 * 0.25 +
        (blocker_count / n) * 0.2 +
        avg_severity * 0.15
    )
    
    return min(max(drift, 0.0), 1.0)

def should_trigger_mirror(drift_score: float, checkin_count: int) -> bool:
    """
    Determine if mirror report should be generated.
    Triggers when: drift > 0.4 and at least 3 checkins
    """
    return drift_score > 0.4 and checkin_count >= 3

def get_drift_rules_applied(drift_score: float, checkins: List[Checkin]) -> List[str]:
    """Return list of rules that were evaluated."""
    rules = []
    
    if not checkins:
        return ["no_checkins"]
    
    n = min(len(checkins), 3)
    recent = checkins[:n]
    
    completion_rate = sum(1 for c in recent if c.completed) / n
    avg_friction = sum(c.friction for c in recent) / n
    blocker_count = sum(1 for c in recent if c.blocker)
    
    if completion_rate < 0.5:
        rules.append(f"low_completion_rate:{completion_rate:.2f}")
    if avg_friction > 2:
        rules.append(f"high_friction:{avg_friction:.2f}")
    if blocker_count >= 2:
        rules.append(f"repeated_blockers:{blocker_count}")
    if drift_score > 0.4:
        rules.append(f"drift_threshold_exceeded:{drift_score:.2f}")
    
    return rules if rules else ["on_track"]
