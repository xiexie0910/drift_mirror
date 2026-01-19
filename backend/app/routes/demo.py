from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.db import get_db
from app.models import Resolution, Plan, Checkin, Signal, MirrorReport

router = APIRouter()

@router.post("/seed")
async def seed_demo_data(db: Session = Depends(get_db)):
    """Seed demo data to trigger mirror report instantly."""
    
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
        why="To connect with my partner's family",
        mode="personal_growth",
        frequency_per_week=5,
        min_minutes=15,
        time_window="morning",
        created_at=datetime.utcnow() - timedelta(days=7)
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
        time_window="morning",
        created_at=datetime.utcnow() - timedelta(days=7)
    )
    db.add(plan)
    db.commit()
    
    # Create 3 checkins with drift pattern
    checkins_data = [
        {
            "planned": "Complete Duolingo lesson on greetings",
            "actual": "Did half the lesson, got distracted",
            "blocker": "Kids needed attention",
            "completed": False,
            "friction": 3,
            "days_ago": 5
        },
        {
            "planned": "Practice vocabulary flashcards",
            "actual": "Skipped entirely",
            "blocker": "Too tired in the morning",
            "completed": False,
            "friction": 3,
            "days_ago": 3
        },
        {
            "planned": "Watch Spanish YouTube video",
            "actual": "Watched 5 minutes",
            "blocker": None,
            "completed": False,
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
            friction=cdata["friction"],
            created_at=datetime.utcnow() - timedelta(days=cdata["days_ago"])
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
    
    # Create mirror report
    mirror = MirrorReport(
        resolution_id=resolution.id,
        findings=[
            {
                "finding": "Morning sessions are consistently interrupted or skipped",
                "evidence": ["Too tired in the morning", "Kids needed attention"],
                "order": 1
            },
            {
                "finding": "External responsibilities are competing with your learning time",
                "evidence": ["Kids needed attention", "Got distracted"],
                "order": 1
            },
            {
                "finding": "The gap between intention and action is widening—this pattern often leads to abandonment if not addressed",
                "evidence": ["3 consecutive incomplete sessions", "Friction increasing over time"],
                "order": 2
            }
        ],
        counterfactual="Based on your pattern, you likely could have completed 2-3 full sessions this week if you shifted to evening time when kids are asleep. That's 30-45 minutes of Spanish practice that was within reach.",
        drift_score=0.65,
        created_at=datetime.utcnow()
    )
    db.add(mirror)
    
    # Create adjusted plan
    adjusted_plan = Plan(
        resolution_id=resolution.id,
        version=2,
        frequency_per_week=4,
        min_minutes=10,
        time_window="evening",
        recovery_step="Try evening sessions when the house is quieter. Start with just 10 minutes—consistency beats duration.",
        created_at=datetime.utcnow()
    )
    db.add(adjusted_plan)
    db.commit()
    
    return {
        "status": "ok",
        "resolution_id": resolution.id,
        "checkins_created": 3,
        "mirror_created": True,
        "plans_created": 2
    }

@router.delete("/clear")
async def clear_demo_data(db: Session = Depends(get_db)):
    """Clear all demo data."""
    db.query(Signal).delete()
    db.query(Checkin).delete()
    db.query(MirrorReport).delete()
    db.query(Plan).delete()
    db.query(Resolution).delete()
    db.commit()
    return {"status": "cleared"}
