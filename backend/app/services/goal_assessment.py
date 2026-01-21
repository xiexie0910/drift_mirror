"""
Goal Assessment Service - Agent A
============================================================
Full-payload assessment of questionnaire data.
Classifies goal type, calculates clarity signals, and determines next steps.
"""
from typing import Optional, List, Literal
from pydantic import BaseModel, Field, field_validator
from enum import Enum

from app.services.llm_client import call_ollama, extract_json_from_response
from app.services.stubs import stub_goal_assessment

# ============================================================
# Spell Check (using pyspellchecker library)
# ============================================================

from spellchecker import SpellChecker

# Initialize spell checker once
_spell = SpellChecker()

# Add domain-specific words that aren't misspellings
_spell.word_frequency.load_words([
    "tennis", "guitar", "yoga", "cardio", "hiit", "pilates",
    "javascript", "typescript", "python", "react", "nodejs",
    "meditation", "mindfulness", "journaling", "podcast",
])

# Context-aware overrides (words that are valid but likely typos in goal context)
GOAL_CONTEXT_FIXES = {
    "git": "get",      # "git fit" -> "get fit" (not the version control)
    "reed": "read",    # "reed books" -> "read books" (not the plant)
    "mor": "more",     # common typo
    "mroe": "more",
}

def spell_check_sync(text: str) -> tuple[str, bool]:
    """
    Check spelling using pyspellchecker library.
    Returns (corrected_text, was_corrected).
    """
    if not text or len(text.strip()) < 2:
        return text, False
    
    words = text.split()
    corrected_words = []
    was_fixed = False
    
    for word in words:
        # Skip short words and numbers
        if len(word) <= 2 or word.isdigit():
            corrected_words.append(word)
            continue
        
        lower_word = word.lower()
        
        # First check context-aware overrides
        if lower_word in GOAL_CONTEXT_FIXES:
            correction = GOAL_CONTEXT_FIXES[lower_word]
            if word[0].isupper():
                correction = correction.capitalize()
            corrected_words.append(correction)
            was_fixed = True
            continue
        
        # Then use pyspellchecker
        if lower_word in _spell:
            corrected_words.append(word)
        else:
            correction = _spell.correction(lower_word)
            if correction and correction != lower_word:
                if word[0].isupper():
                    correction = correction.capitalize()
                corrected_words.append(correction)
                was_fixed = True
            else:
                corrected_words.append(word)
    
    return " ".join(corrected_words), was_fixed

async def spell_check(text: str) -> tuple[str, bool]:
    """Async wrapper for spell check."""
    return spell_check_sync(text)

# ============================================================
# Goal Type Classification
# ============================================================

class GoalType(str, Enum):
    LEARNING = "learning"
    FITNESS = "fitness"
    CREATIVE_OUTPUT = "creative_output"
    PRODUCTIVITY = "productivity"
    HEALTH_WELLBEING = "health_wellbeing"
    CAREER = "career"
    RELATIONSHIP = "relationship"
    OTHER = "other"

# ============================================================
# Input Schemas (Full Questionnaire Payload)
# ============================================================

class BoundariesInput(BaseModel):
    chips: List[str] = Field(default_factory=list)
    custom: Optional[str] = None

class MinimumActionInput(BaseModel):
    text: Optional[str] = None
    minutes: Optional[int] = None

class QuestionnairePayload(BaseModel):
    """Full questionnaire data submitted in one batch."""
    goal: str = Field(..., min_length=1, max_length=500)
    why: str = Field(..., min_length=1, max_length=500)
    boundaries: BoundariesInput = Field(default_factory=BoundariesInput)
    minimum_action: Optional[MinimumActionInput] = None  # Optional field

class AssessmentRequest(BaseModel):
    """Request to assess full questionnaire payload."""
    payload: QuestionnairePayload

# ============================================================
# Output Schemas (Assessment Response)
# ============================================================

class ClaritySignals(BaseModel):
    """Structured clarity scores (0.0-1.0) for each dimension."""
    clarity: float = Field(default=0.5, ge=0.0, le=1.0, description="How clear and specific is the goal")
    scope: float = Field(default=0.5, ge=0.0, le=1.0, description="Is it appropriately scoped (not too broad)")
    actionability: float = Field(default=0.5, ge=0.0, le=1.0, description="Can concrete steps be identified")
    boundaries: float = Field(default=0.5, ge=0.0, le=1.0, description="Are boundaries clearly defined")
    minimum_action: float = Field(default=0.5, ge=0.0, le=1.0, description="Is minimum action clear if provided")

class AssessmentFlags(BaseModel):
    """Boolean flags indicating specific issues detected."""
    vague_outcome: bool = Field(default=False, description="Goal is too vague/abstract")
    too_broad: bool = Field(default=False, description="Goal covers too much scope")
    multiple_goals: bool = Field(default=False, description="User trying to do multiple things")
    unknown_actions: bool = Field(default=False, description="User doesn't know how to start")
    boundary_missing: bool = Field(default=False, description="No meaningful boundaries set")
    feeling_not_action: bool = Field(default=False, description="Goal is a feeling, not an action")
    action_too_big: bool = Field(default=False, description="Minimum action is too ambitious")

class RewriteOption(BaseModel):
    """A suggested rewrite with rationale."""
    text: str = Field(..., description="The complete rewritten text")
    field: Literal["goal", "why", "minimum_action"] = Field(..., description="Which field this rewrites")
    rationale: str = Field(..., description="Brief explanation of the improvement")

class AssessmentResponse(BaseModel):
    """Full assessment response from Agent A."""
    
    # Overall verdict
    status: Literal["ok", "needs_refinement"] = Field(..., description="Whether input needs refinement")
    
    # Classification
    goal_type: GoalType = Field(default=GoalType.OTHER, description="Classified goal category")
    
    # Structured signals
    signals: ClaritySignals = Field(default_factory=ClaritySignals)
    flags: AssessmentFlags = Field(default_factory=AssessmentFlags)
    
    # Issues (for UI display)
    issues: List[str] = Field(default_factory=list, description="List of specific issues found")
    
    # Rewrites (only 1 per field that needs refinement)
    rewrite_options: List[RewriteOption] = Field(default_factory=list)
    
    # Deterministic next-step recommendations
    needs_resource_discovery: bool = Field(default=False, description="Should invoke Agent B for resources")
    suggest_show_rewrite_options: bool = Field(default=False, description="Should show rewrite UI")
    
    # Optional refinement
    best_guess_goal: Optional[str] = Field(default=None, description="LLM's best guess at improved goal")
    
    # Confidence & debug
    confidence: float = Field(default=0.7, ge=0.0, le=1.0)
    debug: dict = Field(default_factory=dict)
    
    @field_validator('issues')
    @classmethod
    def limit_issues(cls, v):
        return v[:5]
    
    @field_validator('rewrite_options')
    @classmethod
    def limit_rewrites(cls, v):
        return v[:3]  # Max 1 per field

# ============================================================
# System Prompt for Full-Payload Assessment
# ============================================================

SYSTEM_PROMPT = """You are a goal clarity coach. You help users transform vague intentions into clear, actionable goals.

INPUT FIELDS:
1. goal: What user wants to be true in the next few months
2. why: Why this matters to them now
3. boundaries: What they won't sacrifice (chips + optional custom text)
4. minimum_action: Their smallest first step (OPTIONAL - may be null/empty)

YOUR TASK:
Analyze the input and return a structured assessment with helpful rewrites.

GOAL TYPE CLASSIFICATION:
Classify into exactly ONE of: learning, fitness, creative_output, productivity, health_wellbeing, career, relationship, other

CLARITY SIGNALS (0.0-1.0):
- clarity: Is the goal specific? "Be healthier"=0.2, "Run 3x/week"=0.9
- scope: Is it appropriately sized? "Change my life"=0.2, "Learn Python basics"=0.8
- actionability: Can we identify concrete steps? "Feel better"=0.3, "Complete a course"=0.9
- boundaries: Are meaningful limits set? None selected=0.3, 2-3 chips=0.8
- minimum_action: If provided, is it truly minimal and doable? (0.5 if not provided)

FLAGS (true/false):
- vague_outcome: Goal uses words like "better", "more", "improve" without specifics
- too_broad: Goal tries to cover too much ("change my whole life")
- multiple_goals: Contains "and" joining different objectives
- unknown_actions: User seems unsure how to start (minimum_action is empty or vague)
- boundary_missing: No boundaries or only vague custom text
- feeling_not_action: Goal describes emotion not behavior ("feel confident")
- action_too_big: minimum_action > 15 min or multiple steps

=== CRITICAL: WRITING GOOD GOAL REWRITES ===

When status="needs_refinement", you MUST provide a rewritten goal that:

1. IS GRAMMATICALLY CORRECT - reads like natural English
2. IS ACTIVITY-SPECIFIC - names the EXACT activity, not a vague category
3. IS ONE THING - not multiple goals joined together
4. PRESERVES USER INTENT - keeps what they meant but makes it concrete

KEY INSIGHT: Make the ACTIVITY specific, NOT the frequency. Frequency comes in the roadmap.

EXAMPLES OF GOOD REWRITES:

User: "exercise more"
✅ Rewrite: "Go to the gym regularly" or "Play basketball" or "Start running"
❌ Bad: "Exercise for 20 minutes 3x/week" (frequency is roadmap's job)

User: "get better at tennis"
✅ Rewrite: "Join a tennis club" or "Practice tennis against the wall"
❌ Bad: "Play tennis more" (still vague about HOW)

User: "learn full stack development"
✅ Rewrite: "Learn full stack web development" (keep it - roadmap will specify backend vs frontend order)
❌ Bad: "Code for 1 hour daily" (wrong - this is scheduling, not goal)

User: "be healthier"
✅ Rewrite: "Start a home workout routine" or "Take daily walks" or "Join a gym"
❌ Bad: "Be healthy 3x/week" (nonsense)

User: "learn python"
✅ Rewrite: "Learn Python through an online course"
❌ Bad: "Study Python 30 min/day" (scheduling, not goal)

User: "read more books"
✅ Rewrite: "Read fiction books regularly" or "Start a book club"
❌ Bad: "Read one book per month" (frequency belongs in roadmap)

User: "feel more confident"
✅ Rewrite: "Join a public speaking group" or "Practice presenting at work"
❌ Bad: "Be confident" (feeling, not activity)

User: "get better at guitar"
✅ Rewrite: "Learn guitar through YouTube tutorials" or "Take guitar lessons"
❌ Bad: "Practice guitar 15 min/day" (scheduling, not goal specificity)

=== RESPONSE FORMAT ===

Return valid JSON only:
{
  "status": "ok" or "needs_refinement",
  "goal_type": "learning|fitness|creative_output|productivity|health_wellbeing|career|relationship|other",
  "signals": {"clarity": 0.8, "scope": 0.7, "actionability": 0.8, "boundaries": 0.6, "minimum_action": 0.5},
  "flags": {"vague_outcome": false, "too_broad": false, "multiple_goals": false, "unknown_actions": true, "boundary_missing": false, "feeling_not_action": false, "action_too_big": false},
  "issues": ["One short issue description"],
  "rewrite_options": [{"text": "Your clear, specific, grammatically correct rewrite", "field": "goal", "rationale": "Added frequency and made it measurable"}],
  "needs_resource_discovery": true,
  "suggest_show_rewrite_options": true,
  "best_guess_goal": "Your best rewrite of their goal",
  "confidence": 0.85
}

Remember: The rewrite must be a COMPLETE, READY-TO-USE goal that the user can adopt directly. It should sound natural and make grammatical sense."""

# ============================================================
# Prompt Builder
# ============================================================

def build_assessment_prompt(payload: QuestionnairePayload) -> str:
    """Build the prompt for full-payload assessment."""
    
    # Format boundaries
    boundaries_str = ""
    if payload.boundaries.chips:
        boundaries_str = f"Selected chips: {', '.join(payload.boundaries.chips)}"
    if payload.boundaries.custom:
        boundaries_str += f"\nCustom boundary: {payload.boundaries.custom}"
    if not boundaries_str:
        boundaries_str = "(none selected)"
    
    # Format minimum action
    action_str = "(not provided - user skipped this optional field)"
    if payload.minimum_action and payload.minimum_action.text:
        action_str = f'"{payload.minimum_action.text}"'
        if payload.minimum_action.minutes:
            action_str += f" ({payload.minimum_action.minutes} minutes)"
    
    return f"""FULL QUESTIONNAIRE SUBMISSION:

GOAL: "{payload.goal}"

WHY: "{payload.why}"

BOUNDARIES:
{boundaries_str}

MINIMUM ACTION (optional):
{action_str}

Assess the ENTIRE payload and return structured JSON response."""

# ============================================================
# Main Assessment Function
# ============================================================

async def assess_questionnaire(
    payload: QuestionnairePayload,
    retry: bool = True
) -> AssessmentResponse:
    """
    Run full-payload assessment with LLM.
    Returns classification, signals, flags, and next-step recommendations.
    """
    # Apply spell checking to user inputs
    corrected_goal, goal_was_corrected = await spell_check(payload.goal)
    corrected_why, why_was_corrected = await spell_check(payload.why)
    
    # Create corrected payload for assessment
    corrected_payload = QuestionnairePayload(
        goal=corrected_goal,
        why=corrected_why,
        boundaries=payload.boundaries,
        minimum_action=payload.minimum_action,
    )
    
    prompt = build_assessment_prompt(corrected_payload)
    
    # Try LLM call
    for attempt in range(2 if retry else 1):
        response_text = await call_ollama(prompt, SYSTEM_PROMPT)
        
        if response_text:
            parsed = extract_json_from_response(response_text)
            if parsed:
                try:
                    # Parse signals
                    signals_data = parsed.get("signals", {})
                    signals = ClaritySignals(
                        clarity=min(1.0, max(0.0, float(signals_data.get("clarity", 0.5)))),
                        scope=min(1.0, max(0.0, float(signals_data.get("scope", 0.5)))),
                        actionability=min(1.0, max(0.0, float(signals_data.get("actionability", 0.5)))),
                        boundaries=min(1.0, max(0.0, float(signals_data.get("boundaries", 0.5)))),
                        minimum_action=min(1.0, max(0.0, float(signals_data.get("minimum_action", 0.5)))),
                    )
                    
                    # Parse flags
                    flags_data = parsed.get("flags", {})
                    flags = AssessmentFlags(
                        vague_outcome=bool(flags_data.get("vague_outcome", False)),
                        too_broad=bool(flags_data.get("too_broad", False)),
                        multiple_goals=bool(flags_data.get("multiple_goals", False)),
                        unknown_actions=bool(flags_data.get("unknown_actions", False)),
                        boundary_missing=bool(flags_data.get("boundary_missing", False)),
                        feeling_not_action=bool(flags_data.get("feeling_not_action", False)),
                        action_too_big=bool(flags_data.get("action_too_big", False)),
                    )
                    
                    # Parse goal type
                    goal_type_str = parsed.get("goal_type", "other").lower()
                    try:
                        goal_type = GoalType(goal_type_str)
                    except ValueError:
                        goal_type = GoalType.OTHER
                    
                    # Parse rewrite options
                    rewrite_options = []
                    for opt in parsed.get("rewrite_options", [])[:3]:
                        if isinstance(opt, dict) and "text" in opt and "field" in opt:
                            field = opt.get("field", "goal")
                            if field in ["goal", "why", "minimum_action"]:
                                rewrite_options.append(RewriteOption(
                                    text=str(opt["text"]),
                                    field=field,
                                    rationale=str(opt.get("rationale", ""))
                                ))
                    
                    # Determine needs_resource_discovery
                    needs_resource = bool(parsed.get("needs_resource_discovery", False))
                    # Also trigger if minimum_action is empty and unknown_actions flag
                    if flags.unknown_actions or (not payload.minimum_action or not payload.minimum_action.text):
                        needs_resource = True
                    
                    result = AssessmentResponse(
                        status=parsed.get("status", "ok"),
                        goal_type=goal_type,
                        signals=signals,
                        flags=flags,
                        issues=parsed.get("issues", [])[:5],
                        rewrite_options=rewrite_options,
                        needs_resource_discovery=needs_resource,
                        suggest_show_rewrite_options=bool(parsed.get("suggest_show_rewrite_options", False)),
                        best_guess_goal=parsed.get("best_guess_goal") or (corrected_goal if goal_was_corrected else None),
                        confidence=min(1.0, max(0.0, float(parsed.get("confidence", 0.7)))),
                        debug={
                            "model_used": "ollama", 
                            "fallback_used": False,
                            "spell_corrected": goal_was_corrected or why_was_corrected,
                            "corrected_goal": corrected_goal if goal_was_corrected else None,
                        }
                    )
                    
                    # Ensure consistency: if needs_refinement, should suggest rewrites
                    if result.status == "needs_refinement" and not result.rewrite_options:
                        result.suggest_show_rewrite_options = True
                    
                    return result
                    
                except Exception:
                    # Silent fail - will retry or use fallback
                    continue
    
    # Fallback to deterministic stub (use corrected payload)
    result = stub_goal_assessment(corrected_payload)
    # Add spell correction info to stub result
    result.debug["spell_corrected"] = goal_was_corrected or why_was_corrected
    if goal_was_corrected:
        result.debug["corrected_goal"] = corrected_goal
        if not result.best_guess_goal:
            result.best_guess_goal = corrected_goal
    return result

# ============================================================
# Keep legacy function for backward compatibility during transition
# ============================================================

from app.services.reality_check import (
    RealityCheckRequest, 
    RealityCheckResponse, 
    run_reality_check
)

__all__ = [
    # New full-payload API
    "QuestionnairePayload",
    "AssessmentRequest", 
    "AssessmentResponse",
    "ClaritySignals",
    "AssessmentFlags",
    "GoalType",
    "RewriteOption",
    "assess_questionnaire",
    # Legacy API (for backward compatibility)
    "RealityCheckRequest",
    "RealityCheckResponse",
    "run_reality_check",
]
