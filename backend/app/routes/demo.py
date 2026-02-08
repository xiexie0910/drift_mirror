"""
Demo Seed Endpoint
============================================================
Creates a complete demo resolution with realistic check-in data
showing a natural drift story: strong start → friction → recovery.

One-click seeding for hackathon demos and new user exploration.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from app.db import get_db
from app.models import Resolution, Plan, Checkin, Signal, MirrorReport

router = APIRouter()


def _build_demo_data():
    """
    Build a compelling 8-check-in story: meditation practice.
    
    Arc: Strong start (days 1-3) → friction builds (days 4-5) → 
         missed sessions (days 6-7) → recovery (day 8)
    """
    now = datetime.now(timezone.utc)
    
    resolution = {
        "title": "Meditate daily for mental clarity",
        "why": "I want to reduce anxiety and be more present with my family",
        "mode": "personal_growth",
        "frequency_per_week": 5,
        "min_minutes": 15,
        "time_window": "morning",
        "minimum_action_text": "Sit quietly and breathe for 5 minutes",
    }
    
    plan = {
        "version": 1,
        "frequency_per_week": 5,
        "min_minutes": 15,
        "time_window": "morning",
    }
    
    # 8 check-ins over ~12 days showing natural drift
    checkins = [
        # Day 1 — Strong start, low friction
        {
            "planned": "Sit quietly and breathe for 5 minutes",
            "actual": "Sit quietly and breathe for 5 minutes. Also: Did a full 15-minute guided session",
            "blocker": None,
            "completed": True,
            "did_minimum_action": True,
            "extra_done": "Did a full 15-minute guided session",
            "friction": 1,
            "days_ago": 12,
            "signals": [
                {"signal_type": "completion", "content": "Completed minimum action", "severity": 0.1},
                {"signal_type": "ease", "content": "Low friction - task felt easy", "severity": 0.2},
                {"signal_type": "extra", "content": "Extra done: Did a full 15-minute guided session", "severity": 0.1},
            ],
        },
        # Day 2 — Good momentum
        {
            "planned": "Sit quietly and breathe for 5 minutes",
            "actual": "Sit quietly and breathe for 5 minutes. Also: 10 minutes with a new breathing technique",
            "blocker": None,
            "completed": True,
            "did_minimum_action": True,
            "extra_done": "10 minutes with a new breathing technique",
            "friction": 1,
            "days_ago": 11,
            "signals": [
                {"signal_type": "completion", "content": "Completed minimum action", "severity": 0.1},
                {"signal_type": "ease", "content": "Low friction - task felt easy", "severity": 0.2},
                {"signal_type": "extra", "content": "Extra done: 10 minutes with a new breathing technique", "severity": 0.1},
            ],
        },
        # Day 4 — Still going, slightly harder
        {
            "planned": "Sit quietly and breathe for 5 minutes",
            "actual": "Sit quietly and breathe for 5 minutes",
            "blocker": None,
            "completed": True,
            "did_minimum_action": True,
            "extra_done": None,
            "friction": 2,
            "days_ago": 9,
            "signals": [
                {"signal_type": "completion", "content": "Completed minimum action", "severity": 0.1},
            ],
        },
        # Day 6 — Friction rising, work pressure
        {
            "planned": "Sit quietly and breathe for 5 minutes",
            "actual": "Sit quietly and breathe for 5 minutes",
            "blocker": "Had an early meeting, almost skipped",
            "completed": True,
            "did_minimum_action": True,
            "extra_done": None,
            "friction": 3,
            "days_ago": 7,
            "signals": [
                {"signal_type": "completion", "content": "Completed minimum action", "severity": 0.1},
                {"signal_type": "friction", "content": "High friction reported", "severity": 0.8},
                {"signal_type": "blocker", "content": "Had an early meeting, almost skipped", "severity": 0.6},
            ],
        },
        # Day 7 — Missed, work took over
        {
            "planned": "Sit quietly and breathe for 5 minutes",
            "actual": "Did not do minimum action",
            "blocker": "Back-to-back meetings all morning, felt too drained",
            "completed": False,
            "did_minimum_action": False,
            "extra_done": None,
            "friction": 3,
            "days_ago": 6,
            "signals": [
                {"signal_type": "miss", "content": "Missed minimum action: Back-to-back meetings all morning, felt too drained", "severity": 0.7},
                {"signal_type": "friction", "content": "High friction reported", "severity": 0.8},
                {"signal_type": "blocker", "content": "Back-to-back meetings all morning, felt too drained", "severity": 0.6},
            ],
        },
        # Day 9 — Missed again
        {
            "planned": "Sit quietly and breathe for 5 minutes",
            "actual": "Did not do minimum action",
            "blocker": "Overslept, rushing to work",
            "completed": False,
            "did_minimum_action": False,
            "extra_done": None,
            "friction": 3,
            "days_ago": 4,
            "signals": [
                {"signal_type": "miss", "content": "Missed minimum action: Overslept, rushing to work", "severity": 0.7},
                {"signal_type": "friction", "content": "High friction reported", "severity": 0.8},
                {"signal_type": "blocker", "content": "Overslept, rushing to work", "severity": 0.6},
            ],
        },
        # Day 10 — Missed, losing momentum
        {
            "planned": "Sit quietly and breathe for 5 minutes",
            "actual": "Did not do minimum action",
            "blocker": "Felt guilty about missing, avoided it entirely",
            "completed": False,
            "did_minimum_action": False,
            "extra_done": None,
            "friction": 3,
            "days_ago": 3,
            "signals": [
                {"signal_type": "miss", "content": "Missed minimum action: Felt guilty about missing, avoided it entirely", "severity": 0.7},
                {"signal_type": "friction", "content": "High friction reported", "severity": 0.8},
                {"signal_type": "blocker", "content": "Felt guilty about missing, avoided it entirely", "severity": 0.6},
            ],
        },
        # Day 12 — Recovery! Did just the minimum
        {
            "planned": "Sit quietly and breathe for 5 minutes",
            "actual": "Sit quietly and breathe for 5 minutes",
            "blocker": None,
            "completed": True,
            "did_minimum_action": True,
            "extra_done": None,
            "friction": 2,
            "days_ago": 1,
            "signals": [
                {"signal_type": "completion", "content": "Completed minimum action", "severity": 0.1},
            ],
        },
    ]
    
    # Pre-computed mirror report reflecting the drift
    mirror_report = {
        "findings": [
            {
                "finding": "Morning meetings are consistently blocking your meditation practice",
                "evidence": [
                    "3 missed sessions in the last week, all citing morning time pressure",
                    "Early meetings mentioned as blocker twice",
                    "Friction jumped from 1 to 3 during this period",
                ],
                "order": 1,
                "root_cause_hypothesis": "Your meditation window conflicts with your work schedule. The plan assumes morning availability that doesn't match your reality.",
            },
            {
                "finding": "Guilt after missing sessions is creating an avoidance spiral",
                "evidence": [
                    "You mentioned 'felt guilty about missing, avoided it entirely'",
                    "3 consecutive missed days followed the first miss",
                    "Friction stayed at maximum during the avoidance period",
                ],
                "order": 2,
                "root_cause_hypothesis": "The all-or-nothing framing makes recovery harder. One miss becomes permission to keep missing.",
            },
        ],
        "counterfactual": "If you shift your practice to evenings or reduce to 3x/week, you'd likely maintain a 80%+ completion rate instead of the current 62%.",
        "drift_score": 0.65,
        "recurring_blockers": [
            "Morning meetings (3 times)",
            "Time pressure / rushing (2 times)",
        ],
        "strength_pattern": "When you do sit down, you often exceed the minimum. Your first 3 sessions show genuine engagement with the practice.",
        "actionable_suggestions": [
            {
                "type": "reduce_frequency",
                "suggestion": "You're hitting 2/5 check-ins this week. Adjusting to 4x per week might feel more sustainable.",
                "changes": {"frequency_per_week": 4},
                "reason": "Weekly rate: 40%",
            },
            {
                "type": "reduce_duration",
                "suggestion": "Your sessions feel harder than they should. Try reducing from 15 to 10 minutes to build momentum.",
                "changes": {"min_minutes": 10},
                "reason": "Average friction is 2.5/3.0",
            },
        ],
    }
    
    return resolution, plan, checkins, mirror_report


@router.post("/seed")
async def seed_demo(db: Session = Depends(get_db)):
    """
    Create a complete demo with:
    - 1 resolution (meditation goal)
    - 1 plan
    - 8 check-ins showing natural drift arc
    - Signals for each check-in
    - 1 mirror report with actionable suggestions
    
    Idempotent: if a demo resolution already exists, returns its ID
    without creating duplicates.
    """
    # Guard against duplicate demo data
    existing = db.query(Resolution).filter(
        Resolution.title == "Meditate daily for mental clarity"
    ).first()
    if existing:
        return {
            "status": "demo_already_exists",
            "resolution_id": existing.id,
            "message": "Demo data already seeded. Returning existing resolution.",
        }

    now = datetime.now(timezone.utc)
    res_data, plan_data, checkins_data, mirror_data = _build_demo_data()
    
    # 1. Create resolution
    resolution = Resolution(**res_data)
    db.add(resolution)
    db.commit()
    db.refresh(resolution)
    
    # 2. Create plan
    plan = Plan(
        resolution_id=resolution.id,
        **plan_data,
    )
    db.add(plan)
    db.commit()
    
    # 3. Create check-ins + signals
    for ci in checkins_data:
        created_at = now - timedelta(days=ci["days_ago"])
        checkin = Checkin(
            resolution_id=resolution.id,
            planned=ci["planned"],
            actual=ci["actual"],
            blocker=ci["blocker"],
            completed=ci["completed"],
            did_minimum_action=ci["did_minimum_action"],
            extra_done=ci["extra_done"],
            friction=ci["friction"],
            created_at=created_at,
        )
        db.add(checkin)
        db.commit()
        db.refresh(checkin)
        
        for sig in ci["signals"]:
            signal = Signal(
                checkin_id=checkin.id,
                signal_type=sig["signal_type"],
                content=sig["content"],
                severity=sig["severity"],
                created_at=created_at,
            )
            db.add(signal)
        db.commit()
    
    # 4. Create mirror report
    mirror = MirrorReport(
        resolution_id=resolution.id,
        findings=mirror_data["findings"],
        counterfactual=mirror_data["counterfactual"],
        drift_score=mirror_data["drift_score"],
        actionable_suggestions=mirror_data["actionable_suggestions"],
        recurring_blockers=mirror_data["recurring_blockers"],
        strength_pattern=mirror_data["strength_pattern"],
    )
    db.add(mirror)
    db.commit()
    db.refresh(mirror)
    
    return {
        "status": "demo_seeded",
        "resolution_id": resolution.id,
        "checkins_created": len(checkins_data),
        "mirror_report_id": mirror.id,
    }
