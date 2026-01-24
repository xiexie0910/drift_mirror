"""
Onboarding Agents - Generate minimum actions and accountability suggestions.
"""
from typing import List
from pydantic import BaseModel, Field

from app.services.llm_client import call_llm, extract_json_from_response
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
    
    response = await call_llm(prompt, MINIMUM_ACTION_GENERATOR_SYSTEM)
    parsed = extract_json_from_response(response)
    
    if not parsed or "minimum_actions" not in parsed:
        raise RuntimeError("Gemini failed to generate minimum actions")
    
    try:
        actions = []
        for action in parsed["minimum_actions"][:6]:
            actions.append(MinimumActionOption(
                text=action.get("text", ""),
                minutes=action.get("minutes", 5),
                rationale=action.get("rationale", "")
            ))
        return MinimumActionsResponse(minimum_actions=actions)
    except Exception as e:
        raise RuntimeError("Gemini returned invalid minimum actions") from e


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
    
    response = await call_llm(prompt, ACCOUNTABILITY_SUGGESTIONS_SYSTEM)
    parsed = extract_json_from_response(response)
    
    if not parsed or "suggestions" not in parsed:
        raise RuntimeError("Gemini failed to generate accountability suggestions")
    
    try:
        suggestions = []
        for suggestion in parsed["suggestions"][:5]:
            suggestions.append(AccountabilitySuggestion(
                text=suggestion.get("text", ""),
                type=suggestion.get("type", "social"),
                rationale=suggestion.get("rationale", "")
            ))
        return AccountabilitySuggestionsResponse(suggestions=suggestions)
    except Exception as e:
        raise RuntimeError("Gemini returned invalid accountability suggestions") from e
