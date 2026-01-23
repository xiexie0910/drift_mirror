"""
Onboarding Agents - Generate minimum actions and accountability suggestions.
"""
from typing import List
from pydantic import BaseModel, Field

from app.services.llm_client import call_ollama, extract_json_from_response
from app.services.prompts import (
    MINIMUM_ACTION_GENERATOR_SYSTEM,
    MINIMUM_ACTION_GENERATOR_PROMPT,
    ACCOUNTABILITY_SUGGESTIONS_SYSTEM,
    ACCOUNTABILITY_SUGGESTIONS_PROMPT,
)
from app.schemas import (
    MinimumActionOption,
    AccountabilitySuggestion,
)


# ============================================================
# Response Models (using schema types)
# ============================================================

class MinimumActionsResponse(BaseModel):
    minimum_actions: List[MinimumActionOption] = Field(default_factory=list)


class AccountabilitySuggestionsResponse(BaseModel):
    suggestions: List[AccountabilitySuggestion] = Field(default_factory=list)


# ============================================================
# Stub Fallbacks
# ============================================================

def stub_minimum_actions(goal: str) -> MinimumActionsResponse:
    """Fallback minimum actions when LLM is unavailable."""
    # Generic but useful minimum actions
    return MinimumActionsResponse(
        minimum_actions=[
            MinimumActionOption(
                text="Set a timer for 2 minutes and start",
                minutes=2,
                rationale="Starting is the hardest part"
            ),
            MinimumActionOption(
                text="Open the app/tool you need and look at it",
                minutes=1,
                rationale="Reducing friction helps you begin"
            ),
            MinimumActionOption(
                text="Do just the first small step",
                minutes=3,
                rationale="One step leads to another"
            ),
            MinimumActionOption(
                text="Prepare your space for the activity",
                minutes=5,
                rationale="Environment design makes habits easier"
            ),
            MinimumActionOption(
                text="Do 5 minutes of the core activity",
                minutes=5,
                rationale="5 minutes often turns into more"
            ),
            MinimumActionOption(
                text="Complete one small unit of the activity",
                minutes=10,
                rationale="Progress builds momentum"
            ),
        ]
    )


def stub_accountability_suggestions() -> AccountabilitySuggestionsResponse:
    """Fallback accountability suggestions when LLM is unavailable."""
    return AccountabilitySuggestionsResponse(
        suggestions=[
            AccountabilitySuggestion(
                text="Find a friend with a similar goal to check in with weekly",
                type="social",
                rationale="Social commitment increases follow-through"
            ),
            AccountabilitySuggestion(
                text="Join an online community focused on your goal",
                type="community",
                rationale="Group identity reinforces the habit"
            ),
            AccountabilitySuggestion(
                text="Set up your environment to make the habit obvious",
                type="environment",
                rationale="Visual cues trigger action"
            ),
            AccountabilitySuggestion(
                text="Tell someone important to you about your goal",
                type="commitment",
                rationale="Public commitment creates accountability"
            ),
            AccountabilitySuggestion(
                text="Track your progress visibly (calendar, app, journal)",
                type="tracking",
                rationale="Seeing progress motivates continuation"
            ),
        ]
    )


# ============================================================
# LLM-Powered Generation
# ============================================================

async def generate_minimum_actions(
    goal: str,
    why: str,
    boundaries: List[str],
    frequency: int
) -> MinimumActionsResponse:
    """
    Generate personalized minimum action options using LLM.
    """
    boundaries_str = ", ".join(boundaries) if boundaries else "None specified"
    
    prompt = MINIMUM_ACTION_GENERATOR_PROMPT.format(
        goal=goal,
        why=why or "Not specified",
        boundaries=boundaries_str,
        frequency=frequency
    )
    
    response = await call_ollama(prompt, MINIMUM_ACTION_GENERATOR_SYSTEM)
    
    if not response:
        return stub_minimum_actions(goal)
    
    parsed = extract_json_from_response(response)
    
    if not parsed or "minimum_actions" not in parsed:
        return stub_minimum_actions(goal)
    
    try:
        actions = []
        for action in parsed["minimum_actions"][:6]:
            actions.append(MinimumActionOption(
                text=action.get("text", ""),
                minutes=action.get("minutes", 5),
                rationale=action.get("rationale", "")
            ))
        return MinimumActionsResponse(minimum_actions=actions)
    except Exception:
        return stub_minimum_actions(goal)


async def generate_accountability_suggestions(
    goal: str,
    why: str,
    boundaries: List[str]
) -> AccountabilitySuggestionsResponse:
    """
    Generate personalized accountability suggestions using LLM.
    """
    boundaries_str = ", ".join(boundaries) if boundaries else "None specified"
    
    prompt = ACCOUNTABILITY_SUGGESTIONS_PROMPT.format(
        goal=goal,
        why=why or "Not specified",
        boundaries=boundaries_str
    )
    
    response = await call_ollama(prompt, ACCOUNTABILITY_SUGGESTIONS_SYSTEM)
    
    if not response:
        return stub_accountability_suggestions()
    
    parsed = extract_json_from_response(response)
    
    if not parsed or "suggestions" not in parsed:
        return stub_accountability_suggestions()
    
    try:
        suggestions = []
        for suggestion in parsed["suggestions"][:5]:
            suggestions.append(AccountabilitySuggestion(
                text=suggestion.get("text", ""),
                type=suggestion.get("type", "social"),
                rationale=suggestion.get("rationale", "")
            ))
        return AccountabilitySuggestionsResponse(suggestions=suggestions)
    except Exception:
        return stub_accountability_suggestions()
