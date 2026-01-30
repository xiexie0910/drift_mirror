from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
import os
from app.db import get_db
from app.models import Resolution, Plan, Checkin, Signal, MirrorReport

router = APIRouter()

# Demo routes only enabled in development
IS_PRODUCTION = os.getenv("ENVIRONMENT", "development") == "production"

def check_demo_enabled():
    """Disable demo routes in production."""
    if IS_PRODUCTION:
        raise HTTPException(status_code=404, detail="Not found")

@router.post("/seed")
async def seed_demo_data(db: Session = Depends(get_db)):
    """Seed demo data to trigger mirror report instantly."""
    check_demo_enabled()
    
    # Clear existing data
    db.query(Signal).delete()
    db.query(Checkin).delete()
    db.query(MirrorReport).delete()
    db.query(Plan).delete()
    db.query(Resolution).delete()
    db.commit()
    
    # Create demo resolution
    resolution = Resolution(
        title="Learn Spanish for 15 minutes daily",
        why="To connect with my partner's family and feel less left out during family gatherings",
        mode="personal_growth",
        frequency_per_week=5,
        min_minutes=15,
        minimum_action_text="Open Duolingo and complete just ONE lesson (about 3 minutes)",
        created_at=datetime.now(timezone.utc) - timedelta(days=10)
    )
    db.add(resolution)
    db.commit()
    db.refresh(resolution)
    
    # Create initial plan
    plan = Plan(
        resolution_id=resolution.id,
        version=1,
        frequency_per_week=5,
        min_minutes=15,
        created_at=datetime.now(timezone.utc) - timedelta(days=10)
    )
    db.add(plan)
    db.commit()
    
    # Create 5 checkins with realistic drift pattern (showing both successes and struggles)
    checkins_data = [
        {
            "planned": "Complete Duolingo lesson on greetings",
            "actual": "Finished the whole lesson! Feeling motivated",
            "blocker": None,
            "completed": True,
            "did_minimum_action": True,
            "extra_done": "Also reviewed yesterday's vocabulary",
            "friction": 1,
            "days_ago": 9
        },
        {
            "planned": "Practice vocabulary flashcards",
            "actual": "Did half the lesson, got distracted by work email",
            "blocker": "Work emergency came up",
            "completed": False,
            "did_minimum_action": True,
            "extra_done": None,
            "friction": 2,
            "days_ago": 7
        },
        {
            "planned": "Complete Duolingo lesson on family words",
            "actual": "Skipped entirely - overslept",
            "blocker": "Too tired in the morning, stayed up late",
            "completed": False,
            "did_minimum_action": False,
            "extra_done": None,
            "friction": 3,
            "days_ago": 5
        },
        {
            "planned": "Practice speaking with voice exercises",
            "actual": "Did 5 minutes of flashcards instead",
            "blocker": "Kids were already awake, couldn't do voice exercises",
            "completed": False,
            "did_minimum_action": True,
            "extra_done": None,
            "friction": 3,
            "days_ago": 3
        },
        {
            "planned": "Watch Spanish YouTube video",
            "actual": "Watched 5 minutes, then got pulled into morning routine",
            "blocker": "Morning routine too hectic",
            "completed": False,
            "did_minimum_action": True,
            "extra_done": None,
            "friction": 2,
            "days_ago": 1
        }
    ]
    
    for cdata in checkins_data:
        checkin = Checkin(
            resolution_id=resolution.id,
            planned=cdata["planned"],
            actual=cdata["actual"],
            blocker=cdata["blocker"],
            completed=cdata["completed"],
            did_minimum_action=cdata.get("did_minimum_action", False),
            extra_done=cdata.get("extra_done"),
            friction=cdata["friction"],
            created_at=datetime.now(timezone.utc) - timedelta(days=cdata["days_ago"])
        )
        db.add(checkin)
        db.commit()
        db.refresh(checkin)
        
        # Add signals for each checkin
        signals = []
        if cdata["blocker"]:
            signals.append(Signal(
                checkin_id=checkin.id,
                signal_type="blocker",
                content=f"Blocked by: {cdata['blocker']}",
                severity=0.6
            ))
        if cdata["friction"] >= 3:
            signals.append(Signal(
                checkin_id=checkin.id,
                signal_type="friction",
                content="High friction reported",
                severity=0.7
            ))
        if not cdata["completed"]:
            signals.append(Signal(
                checkin_id=checkin.id,
                signal_type="gap",
                content=f"Planned '{cdata['planned'][:30]}...' but '{cdata['actual'][:30]}...'",
                severity=0.5
            ))
        
        for sig in signals:
            db.add(sig)
    
    db.commit()
    
    # Create mirror report with rich insights
    mirror = MirrorReport(
        resolution_id=resolution.id,
        findings=[
            {
                "finding": "Morning sessions are consistently interrupted or skipped due to morning chaos",
                "evidence": [
                    "\"Too tired in the morning, stayed up late\"",
                    "\"Kids were already awake, couldn't do voice exercises\"",
                    "\"Morning routine too hectic\""
                ],
                "order": 1,
                "root_cause_hypothesis": "Your mornings have too many competing priorities. The window between waking up and family responsibilities is too narrow for focused learning."
            },
            {
                "finding": "You're actually showing up most days—just not completing full sessions",
                "evidence": [
                    "4 out of 5 days you did your minimum action",
                    "Even on hard days, you opened the app"
                ],
                "order": 1,
                "root_cause_hypothesis": "The habit trigger is working. The issue isn't motivation—it's environmental friction during morning hours."
            },
            {
                "finding": "This drift pattern typically leads to abandonment within 2 weeks without intervention",
                "evidence": [
                    "Friction scores increased from 1 → 3 over the week",
                    "Session completions dropped from 100% to 0%"
                ],
                "order": 2,
                "root_cause_hypothesis": "The initial momentum faded as friction increased. Common blockers emerged that weren't anticipated in the original plan."
            }
        ],
        counterfactual="Looking at your week: You completed your minimum action 4 out of 5 days, but only finished 1 full session. With better friction management on those days, you likely would have completed 3 full sessions—that's 30+ more minutes of Spanish practice that was within reach.",
        drift_score=0.52,
        recurring_blockers=[
            "Too tired/low energy (3 times)",
            "Ran out of time/scheduling conflict (2 times)"
        ],
        strength_pattern="You're showing up consistently—opening the app on 4 out of 5 days even when full completion wasn't possible. This foundation is strong.",
        actionable_suggestions=[
            {
                "type": "reduce_friction",
                "suggestion": "Keep Duolingo app visible on home screen, pre-loaded in morning",
                "changes": {},
                "reason": "Your minimum action completion is strong at 80%. Reducing friction on full sessions could unlock more completions."
            },
            {
                "type": "reduce_frequency",
                "suggestion": "Reduce from 5x to 4x per week to match your actual capacity",
                "changes": {"frequency_per_week": 4},
                "reason": "You're hitting about 80% of days. Setting 4x as the target turns current performance into success."
            }
        ],
        created_at=datetime.now(timezone.utc)
    )
    db.add(mirror)
    
    # Create adjusted plan
    adjusted_plan = Plan(
        resolution_id=resolution.id,
        version=2,
        frequency_per_week=4,
        min_minutes=15,
        recovery_step="If you miss, do the minimum: open Duolingo and do ONE lesson. Getting it done beats getting it perfect.",
        created_at=datetime.now(timezone.utc)
    )
    db.add(adjusted_plan)
    db.commit()
    
    return {
        "status": "ok",
        "resolution_id": resolution.id,
        "checkins_created": 5,
        "mirror_created": True,
        "plans_created": 2
    }

@router.delete("/clear")
async def clear_demo_data(db: Session = Depends(get_db)):
    """Clear all demo data."""
    check_demo_enabled()
    db.query(Signal).delete()
    db.query(Checkin).delete()
    db.query(MirrorReport).delete()
    db.query(Plan).delete()
    db.query(Resolution).delete()
    db.commit()
    return {"status": "cleared"}
