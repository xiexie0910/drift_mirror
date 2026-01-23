"""
Progress Summary Service - Generates AI-powered progress summaries from check-in notes.
"""
from typing import Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field

from app.services.llm_client import call_ollama, extract_json_from_response
from app.services.prompts import PROGRESS_SUMMARY_SYSTEM, PROGRESS_SUMMARY_PROMPT


class ProgressSummaryResponse(BaseModel):
    overall_progress: str
    key_wins: List[str] = Field(default_factory=list)
    growth_observed: str
    encouragement: str
    days_to_habit: int


def stub_progress_summary(
    total_checkins: int,
    completion_rate: float,
    days_tracked: int
) -> ProgressSummaryResponse:
    """Fallback when LLM is unavailable."""
    days_to_habit = max(0, 90 - days_tracked)
    
    if total_checkins == 0:
        return ProgressSummaryResponse(
            overall_progress="You're just getting started! Every journey begins with a single step.",
            key_wins=["You've set your goal and created a plan"],
            growth_observed="The fact that you're here shows commitment to growth.",
            encouragement="Start your first check-in today and begin building your habit!",
            days_to_habit=90
        )
    
    if completion_rate >= 0.8:
        return ProgressSummaryResponse(
            overall_progress=f"Excellent consistency! You've checked in {total_checkins} times with a {int(completion_rate*100)}% completion rate.",
            key_wins=[
                "Maintained strong consistency",
                f"Completed {total_checkins} check-ins",
                "Building a solid habit foundation"
            ],
            growth_observed="Your dedication is clearly visible in your consistent effort.",
            encouragement=f"Only {days_to_habit} days until you hit the 90-day habit milestone. Keep going!",
            days_to_habit=days_to_habit
        )
    elif completion_rate >= 0.5:
        return ProgressSummaryResponse(
            overall_progress=f"Good progress! You've checked in {total_checkins} times and are building momentum.",
            key_wins=[
                f"Tracked progress {total_checkins} times",
                "Maintained consistent effort",
            ],
            growth_observed="You're learning what works for you and adjusting.",
            encouragement=f"You're {days_tracked} days into your journey. Every check-in counts!",
            days_to_habit=days_to_habit
        )
    else:
        return ProgressSummaryResponse(
            overall_progress=f"You've started your journey with {total_checkins} check-ins. Progress isn't always linear!",
            key_wins=[
                "You showed up and tracked your progress",
                "You're being honest about your journey"
            ],
            growth_observed="Recognizing challenges is the first step to overcoming them.",
            encouragement="Focus on your minimum action. Even 2 minutes counts!",
            days_to_habit=days_to_habit
        )


async def generate_progress_summary(
    goal_title: str,
    goal_why: str,
    notes: List[dict],  # List of {date, note, did_minimum}
    total_checkins: int,
    completion_rate: float,
    created_at: datetime
) -> ProgressSummaryResponse:
    """
    Generate an AI-powered progress summary from check-in notes.
    """
    # Calculate days tracked, handling both naive and aware datetimes
    now = datetime.now(timezone.utc)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)
    days_tracked = (now - created_at).days
    days_to_habit = max(0, 90 - days_tracked)
    
    # Build timeline of notes
    if not notes:
        return stub_progress_summary(total_checkins, completion_rate, days_tracked)
    
    notes_timeline = "\n".join([
        f"Day {i+1} ({n['date']}): {'✓' if n['did_minimum'] else '✗'} {n['note']}"
        for i, n in enumerate(notes) if n['note']
    ])
    
    if not notes_timeline.strip():
        return stub_progress_summary(total_checkins, completion_rate, days_tracked)
    
    prompt = PROGRESS_SUMMARY_PROMPT.format(
        goal_title=goal_title,
        goal_why=goal_why or "Not specified",
        days_tracked=days_tracked,
        total_checkins=total_checkins,
        completion_rate=int(completion_rate * 100),
        notes_timeline=notes_timeline,
        days_to_habit=days_to_habit
    )
    
    response = await call_ollama(prompt, PROGRESS_SUMMARY_SYSTEM)
    
    if not response:
        return stub_progress_summary(total_checkins, completion_rate, days_tracked)
    
    parsed = extract_json_from_response(response)
    
    if not parsed:
        return stub_progress_summary(total_checkins, completion_rate, days_tracked)
    
    try:
        return ProgressSummaryResponse(
            overall_progress=parsed.get("overall_progress", ""),
            key_wins=parsed.get("key_wins", [])[:3],
            growth_observed=parsed.get("growth_observed", ""),
            encouragement=parsed.get("encouragement", ""),
            days_to_habit=parsed.get("days_to_habit", days_to_habit)
        )
    except Exception:
        return stub_progress_summary(total_checkins, completion_rate, days_tracked)
