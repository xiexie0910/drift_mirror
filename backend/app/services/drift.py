from typing import List, Dict, Tuple, Optional
from datetime import datetime, timedelta, timezone
from app.models import Checkin, Signal, Plan


def get_weekly_frequency_stats(checkins: List[Checkin], target_frequency: int) -> Dict:
    """
    Calculate how well user is hitting their weekly frequency target.
    
    Returns:
        {
            'this_week_count': int,
            'this_week_target': int,
            'this_week_rate': float (0-1),
            'last_week_count': int,
            'last_week_rate': float,
            'trend': 'improving' | 'declining' | 'stable',
            'days_since_last': int or None
        }
    """
    if not checkins:
        return {
            'this_week_count': 0,
            'this_week_target': target_frequency,
            'this_week_rate': 0.0,
            'last_week_count': 0,
            'last_week_rate': 0.0,
            'trend': 'stable',
            'days_since_last': None
        }
    
    now = datetime.now(timezone.utc)
    
    # Calculate week boundaries (Monday = 0)
    days_since_monday = now.weekday()
    this_week_start = now - timedelta(days=days_since_monday, hours=now.hour, minutes=now.minute, seconds=now.second)
    last_week_start = this_week_start - timedelta(days=7)
    
    # Count check-ins per week (only completed ones)
    this_week = [c for c in checkins if c.created_at >= this_week_start and c.did_minimum_action]
    last_week = [c for c in checkins if last_week_start <= c.created_at < this_week_start and c.did_minimum_action]
    
    this_week_count = len(this_week)
    last_week_count = len(last_week)
    
    this_week_rate = min(this_week_count / target_frequency, 1.0) if target_frequency > 0 else 0
    last_week_rate = min(last_week_count / target_frequency, 1.0) if target_frequency > 0 else 0
    
    # Determine trend
    if this_week_rate > last_week_rate + 0.1:
        trend = 'improving'
    elif this_week_rate < last_week_rate - 0.1:
        trend = 'declining'
    else:
        trend = 'stable'
    
    # Days since last check-in
    days_since_last = None
    if checkins:
        last_checkin = max(checkins, key=lambda c: c.created_at)
        days_since_last = (now - last_checkin.created_at).days
    
    return {
        'this_week_count': this_week_count,
        'this_week_target': target_frequency,
        'this_week_rate': round(this_week_rate, 2),
        'last_week_count': last_week_count,
        'last_week_rate': round(last_week_rate, 2),
        'trend': trend,
        'days_since_last': days_since_last
    }


def compute_drift_score(
    checkins: List[Checkin], 
    signals: List[Signal],
    target_frequency: int = 3
) -> float:
    """
    Compute drift score (0-1) based on:
    1. Weekly frequency compliance (are they hitting X times per week?)
    2. Completion rate (did they do their minimum action?)
    3. Friction levels
    4. Blockers
    
    Higher = more drift from plan.
    """
    if not checkins:
        return 0.0
    
    # Get frequency stats
    freq_stats = get_weekly_frequency_stats(checkins, target_frequency)
    
    # Recent check-in analysis (last 3-5)
    n = min(len(checkins), 5)
    recent = checkins[:n]
    
    # Factor 1: Frequency compliance (40% weight)
    # How well are they hitting their weekly target?
    frequency_drift = 1.0 - freq_stats['this_week_rate']
    
    # Factor 2: Minimum action completion rate (25% weight)
    completion_rate = sum(1 for c in recent if c.did_minimum_action) / n
    completion_drift = 1.0 - completion_rate
    
    # Factor 3: Friction (20% weight)
    avg_friction = sum(c.friction for c in recent) / n
    friction_drift = (avg_friction - 1) / 2  # Normalize: 1=0, 3=1
    
    # Factor 4: Blockers (15% weight)
    blocker_rate = sum(1 for c in recent if c.blocker) / n
    
    # Weighted drift score
    drift = (
        frequency_drift * 0.40 +
        completion_drift * 0.25 +
        friction_drift * 0.20 +
        blocker_rate * 0.15
    )
    
    return min(max(drift, 0.0), 1.0)


def should_trigger_mirror(drift_score: float, checkin_count: int) -> bool:
    """
    Determine if mirror report should be generated.
    Triggers when: drift > 0.4 and at least 3 checkins
    """
    return drift_score > 0.4 and checkin_count >= 3


def get_drift_rules_applied(
    drift_score: float, 
    checkins: List[Checkin],
    target_frequency: int = 3
) -> List[str]:
    """Return list of specific patterns detected."""
    rules = []
    
    if not checkins:
        return ["no_checkins"]
    
    freq_stats = get_weekly_frequency_stats(checkins, target_frequency)
    n = min(len(checkins), 5)
    recent = checkins[:n]
    
    completion_rate = sum(1 for c in recent if c.did_minimum_action) / n
    avg_friction = sum(c.friction for c in recent) / n
    blocker_count = sum(1 for c in recent if c.blocker)
    
    # Frequency-based rules
    if freq_stats['this_week_rate'] < 0.5:
        rules.append(f"below_weekly_target:{freq_stats['this_week_count']}/{freq_stats['this_week_target']}")
    
    if freq_stats['trend'] == 'declining':
        rules.append("declining_frequency")
    
    if freq_stats['days_since_last'] and freq_stats['days_since_last'] >= 3:
        rules.append(f"gap_detected:{freq_stats['days_since_last']}_days")
    
    # Behavior-based rules
    if completion_rate < 0.5:
        rules.append(f"low_completion:{completion_rate:.0%}")
    
    if avg_friction > 2:
        rules.append(f"high_friction:{avg_friction:.1f}/3")
    
    if blocker_count >= 2:
        rules.append(f"repeated_blockers:{blocker_count}")
    
    if drift_score > 0.6:
        rules.append("significant_drift")
    elif drift_score > 0.4:
        rules.append("moderate_drift")
    
    return rules if rules else ["on_track"]
