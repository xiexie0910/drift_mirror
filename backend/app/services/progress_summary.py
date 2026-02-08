"""
Progress Summary Service - Generates AI-powered progress summaries from check-in notes.
"""
import logging
from typing import Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field

from app.services.llm_client import call_llm, extract_json_from_response
from app.services.prompts import PROGRESS_SUMMARY_SYSTEM, PROGRESS_SUMMARY_PROMPT

logger = logging.getLogger(__name__)


class ProgressSummaryResponse(BaseModel):
    overall_progress: str
    key_wins: List[str] = Field(default_factory=list)
    growth_observed: str
    encouragement: str
    days_to_habit: int


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
        raise RuntimeError("No check-in notes available for progress summary")
    
    notes_timeline = "\n".join([
        f"Day {i+1} ({n['date']}): {'✓' if n['did_minimum'] else '✗'} {n['note']}"
        for i, n in enumerate(notes) if n['note']
    ])
    
    if not notes_timeline.strip():
        raise RuntimeError("No valid check-in notes available for progress summary")
    
    prompt = PROGRESS_SUMMARY_PROMPT.format(
        goal_title=goal_title,
        goal_why=goal_why or "Not specified",
        days_tracked=days_tracked,
        total_checkins=total_checkins,
        completion_rate=int(completion_rate * 100),
        notes_timeline=notes_timeline,
        days_to_habit=days_to_habit
    )
    
    try:
        response = await call_llm(prompt, PROGRESS_SUMMARY_SYSTEM)
        parsed = extract_json_from_response(response)
        
        if parsed:
            return ProgressSummaryResponse(
                overall_progress=parsed.get("overall_progress", ""),
                key_wins=parsed.get("key_wins", [])[:3],
                growth_observed=parsed.get("growth_observed", ""),
                encouragement=parsed.get("encouragement", ""),
                days_to_habit=parsed.get("days_to_habit", days_to_habit)
            )
    except Exception as e:
        logger.warning(f"LLM progress summary failed, using fallback: {e}")

    # Deterministic fallback when LLM is unavailable
    rate_pct = int(completion_rate * 100)
    return ProgressSummaryResponse(
        overall_progress=f"You've checked in {total_checkins} times with a {rate_pct}% completion rate over {days_tracked} days.",
        key_wins=[n['note'] for n in notes[:3] if n.get('did_minimum')],
        growth_observed="Keep showing up — patterns become clearer with more data.",
        encouragement="Every check-in counts, even the imperfect ones.",
        days_to_habit=days_to_habit,
    )
