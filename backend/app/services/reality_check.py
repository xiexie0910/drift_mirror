"""
Reality Check Assessor - LLM-powered goal refinement for onboarding wizard.
"""
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator
import json

from app.services.llm_client import call_ollama, extract_json_from_response

# ============================================================
# Pydantic Schemas
# ============================================================

class BoundariesInput(BaseModel):
    chips: List[str] = Field(default_factory=list)
    custom: Optional[str] = None

class MinimumActionInput(BaseModel):
    text: Optional[str] = None
    minutes: Optional[int] = None

class GoalContractSoFar(BaseModel):
    goal: Optional[str] = None
    why: Optional[str] = None
    boundaries: Optional[BoundariesInput] = None
    minimum_action: Optional[MinimumActionInput] = None

class RealityCheckRequest(BaseModel):
    step: str = Field(..., pattern="^(goal|why|boundaries|minimum_action)$")
    goal_contract_so_far: GoalContractSoFar = Field(default_factory=GoalContractSoFar)
    user_input: dict

class RealityCheckResponse(BaseModel):
    status: str = Field(..., pattern="^(ok|needs_refinement)$")
    issues: List[str] = Field(default_factory=list, max_length=4)
    rewrite_options: List[str] = Field(default_factory=list)
    clarifying_questions: List[str] = Field(default_factory=list)
    best_guess_refinement: Optional[str] = None
    confidence: float = Field(default=0.7, ge=0.0, le=1.0)
    debug: dict = Field(default_factory=dict)
    
    @field_validator('issues')
    @classmethod
    def limit_issues(cls, v):
        return v[:4]
    
    @field_validator('rewrite_options')
    @classmethod
    def limit_rewrites(cls, v):
        return v[:3]
    
    @field_validator('clarifying_questions')
    @classmethod
    def limit_questions(cls, v):
        return v[:2]

# ============================================================
# Prompt Templates
# ============================================================

SYSTEM_PROMPT = """You are a goal clarity assessor. Your job is to help users write clear, specific, actionable goals.

RULES:
- Keep tone neutral, practical, non-judgmental
- No therapy, no diagnosis, no medical/mental-health advice
- Focus ONLY on clarity, specificity, and achievability
- Do NOT generate long plans - only refine the current input
- Respect any boundaries the user has set (no 80-hour weeks, etc.)
- Always provide at least 2 rewrite options when needs_refinement
- Keep rewrites short and actionable

PHILOSOPHY: "Start before you think about the value. Value comes after you start. Don't wait."
"""

def get_step_prompt(step: str, user_input: dict, context: GoalContractSoFar) -> str:
    context_str = ""
    if context.goal:
        context_str += f"Their goal: {context.goal}\n"
    if context.why:
        context_str += f"Their why: {context.why}\n"
    if context.boundaries:
        chips = ", ".join(context.boundaries.chips) if context.boundaries.chips else "none"
        context_str += f"Their boundaries: {chips}\n"
        if context.boundaries.custom:
            context_str += f"Custom boundary: {context.boundaries.custom}\n"
    
    if step == "goal":
        input_text = user_input.get("goal", "")
        return f"""User is defining their goal (outcome).
{context_str}
User wrote: "{input_text}"

Assess if this is a clear, specific, measurable outcome (not a feeling).
Bad examples: "be happier", "get better at stuff", "improve"
Good examples: "Run a 5K", "Read 12 books this year", "Learn basic Spanish conversation"

Return JSON:
{{"status": "ok" or "needs_refinement", "issues": ["short issue"], "rewrite_options": ["suggestion1", "suggestion2"], "clarifying_questions": ["optional question"], "best_guess_refinement": "your best rewrite or null", "confidence": 0.0-1.0}}"""

    elif step == "why":
        input_text = user_input.get("why", "")
        return f"""User is explaining why their goal matters.
{context_str}
User wrote: "{input_text}"

Assess if this is a genuine, personal reason (not generic or performative).
Bad examples: "because I should", "everyone says so", "to impress people"
Good examples: "To keep up with my kids", "To feel capable again", "To prove I can finish something"

Return JSON:
{{"status": "ok" or "needs_refinement", "issues": ["short issue"], "rewrite_options": ["suggestion1", "suggestion2"], "clarifying_questions": ["optional question"], "best_guess_refinement": "your best rewrite or null", "confidence": 0.0-1.0}}"""

    elif step == "boundaries":
        chips = user_input.get("chips", [])
        custom = user_input.get("custom", "")
        return f"""User is setting boundaries (what they won't sacrifice).
{context_str}
Selected chips: {chips}
Custom boundary: "{custom}"

Assess if boundaries are clear and protect something meaningful.
If no boundaries selected, gently suggest they pick at least one.

Return JSON:
{{"status": "ok" or "needs_refinement", "issues": ["short issue"], "rewrite_options": ["suggestion1", "suggestion2"], "clarifying_questions": ["optional question"], "best_guess_refinement": "suggested boundary or null", "confidence": 0.0-1.0}}"""

    elif step == "minimum_action":
        text = user_input.get("text", "")
        minutes = user_input.get("minutes")
        return f"""User is defining their minimum action (smallest step on a bad day).
{context_str}
Action: "{text}"
Minutes: {minutes}

Assess if this is truly minimal (2-10 minutes), specific, and doable even when tired/stressed.
Bad examples: "exercise for an hour", "finish the whole chapter", "do my best"
Good examples: "Put on running shoes and step outside", "Read one page", "Write one sentence"

Return JSON:
{{"status": "ok" or "needs_refinement", "issues": ["short issue"], "rewrite_options": ["suggestion1", "suggestion2"], "clarifying_questions": ["optional question"], "best_guess_refinement": "your best rewrite or null", "confidence": 0.0-1.0}}"""

    return ""

# ============================================================
# Fallback Stub (Demo-Safe)
# ============================================================

def stub_reality_check(step: str, user_input: dict, context: GoalContractSoFar) -> RealityCheckResponse:
    """Deterministic fallback when LLM is unavailable."""
    
    # Get the input text based on step
    if step == "goal":
        text = user_input.get("goal", "")
    elif step == "why":
        text = user_input.get("why", "")
    elif step == "boundaries":
        chips = user_input.get("chips", [])
        custom = user_input.get("custom", "")
        text = custom if custom else " ".join(chips)
    elif step == "minimum_action":
        text = user_input.get("text", "")
    else:
        text = ""
    
    # Simple heuristics
    is_too_short = len(text.strip()) < 10
    is_too_vague = any(word in text.lower() for word in ["better", "more", "improve", "stuff", "things"])
    
    if step == "boundaries":
        chips = user_input.get("chips", [])
        if len(chips) == 0 and not user_input.get("custom"):
            return RealityCheckResponse(
                status="needs_refinement",
                issues=["No boundaries selected"],
                rewrite_options=["Try selecting at least one boundary", "Consider 'No burnout' or 'No losing sleep'"],
                clarifying_questions=["What would make this goal feel too costly?"],
                confidence=0.8,
                debug={"model_used": "stub", "fallback_used": True}
            )
        return RealityCheckResponse(
            status="ok",
            issues=[],
            rewrite_options=[],
            clarifying_questions=[],
            confidence=0.9,
            debug={"model_used": "stub", "fallback_used": True}
        )
    
    if is_too_short:
        templates = {
            "goal": {
                "issues": ["Goal is very brief"],
                "rewrites": ["Try: 'Run a 5K in 3 months'", "Try: 'Read one book per month'"],
                "question": "What specific outcome would success look like?"
            },
            "why": {
                "issues": ["Reason is quite short"],
                "rewrites": ["Try: 'To keep up with my kids'", "Try: 'To feel capable again'"],
                "question": "What changes when you achieve this?"
            },
            "minimum_action": {
                "issues": ["Action could be more specific"],
                "rewrites": ["Try: 'Put on shoes and walk to the door'", "Try: 'Open the book and read one paragraph'"],
                "question": "What's the very first physical thing you'd do?"
            }
        }
        t = templates.get(step, templates["goal"])
        return RealityCheckResponse(
            status="needs_refinement",
            issues=t["issues"],
            rewrite_options=t["rewrites"],
            clarifying_questions=[t["question"]],
            confidence=0.7,
            debug={"model_used": "stub", "fallback_used": True}
        )
    
    if is_too_vague:
        templates = {
            "goal": {
                "issues": ["Goal could be more specific"],
                "rewrites": [f"Instead of '{text[:30]}...', try a measurable outcome", "What would you show someone to prove success?"],
                "question": "How will you know when you've achieved this?"
            },
            "why": {
                "issues": ["Reason could be more personal"],
                "rewrites": ["Connect it to something you care about", "What changes in your daily life?"],
                "question": "What happens if you don't do this?"
            },
            "minimum_action": {
                "issues": ["Action seems too big for a bad day"],
                "rewrites": ["Cut it in half", "What if you only had 2 minutes?"],
                "question": "Could you do this while exhausted?"
            }
        }
        t = templates.get(step, templates["goal"])
        return RealityCheckResponse(
            status="needs_refinement",
            issues=t["issues"],
            rewrite_options=t["rewrites"],
            clarifying_questions=[t["question"]],
            confidence=0.6,
            debug={"model_used": "stub", "fallback_used": True}
        )
    
    # Input seems okay
    return RealityCheckResponse(
        status="ok",
        issues=[],
        rewrite_options=[],
        clarifying_questions=[],
        confidence=0.8,
        debug={"model_used": "stub", "fallback_used": True}
    )

# ============================================================
# Main Reality Check Function
# ============================================================

async def run_reality_check(
    step: str,
    user_input: dict,
    context: GoalContractSoFar,
    retry: bool = True
) -> RealityCheckResponse:
    """
    Run LLM reality check with timeout, retry, and fallback.
    """
    prompt = get_step_prompt(step, user_input, context)
    
    # Try LLM call
    for attempt in range(2 if retry else 1):
        response_text = await call_ollama(prompt, SYSTEM_PROMPT)
        
        if response_text:
            parsed = extract_json_from_response(response_text)
            if parsed:
                try:
                    # Validate with Pydantic
                    result = RealityCheckResponse(
                        status=parsed.get("status", "ok"),
                        issues=parsed.get("issues", [])[:4],
                        rewrite_options=parsed.get("rewrite_options", [])[:3],
                        clarifying_questions=parsed.get("clarifying_questions", [])[:2],
                        best_guess_refinement=parsed.get("best_guess_refinement"),
                        confidence=min(1.0, max(0.0, float(parsed.get("confidence", 0.7)))),
                        debug={"model_used": "ollama", "fallback_used": False}
                    )
                    
                    # Ensure needs_refinement has at least 2 rewrite options
                    if result.status == "needs_refinement" and len(result.rewrite_options) < 2:
                        result.rewrite_options.extend(["Consider being more specific", "Try a measurable outcome"])
                        result.rewrite_options = result.rewrite_options[:3]
                    
                    return result
                except Exception as e:
                    print(f"Reality check parse error: {e}")
                    continue
    
    # Fallback to stub
    return stub_reality_check(step, user_input, context)
