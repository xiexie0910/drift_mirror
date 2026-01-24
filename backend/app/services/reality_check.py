"""
Reality Check Assessor - LLM-powered goal refinement for onboarding wizard.
"""
from typing import Optional, List
from pydantic import BaseModel, Field, field_validator

from app.services.llm_client import call_llm, extract_json_from_response
from app.services.stubs import stub_reality_check

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
        return v[:1]
    
    @field_validator('clarifying_questions')
    @classmethod
    def limit_questions(cls, v):
        return v[:2]

# ============================================================
# Prompt Templates
# ============================================================

SYSTEM_PROMPT = """You are a goal clarity detector. Your ONLY job is to determine if the user's input is CLEAR and SINGULAR enough.

CLARITY RULES:
1. ONE THING ONLY: The input must describe exactly ONE goal/action, not multiple. "Exercise and read more" = needs_refinement.
2. SPECIFIC: Must be concrete and observable. "Be better" = needs_refinement. "Run 3x per week" = ok.
3. MEASURABLE: You could verify if it happened. "Improve my health" = needs_refinement. "Lose 10 pounds" = ok.
4. NOT A FEELING: Must be an action or outcome, not an emotion. "Feel happier" = needs_refinement.
5. ACTIONABLE: Something the user can actually DO. "Be lucky" = needs_refinement.

DETECTION SIGNALS FOR needs_refinement:
- Contains "and" or commas listing multiple things
- Uses vague words: better, more, improve, stuff, things, try, maybe, kind of
- Describes a feeling rather than an action
- Is shorter than 5 words
- Contains no concrete nouns (what, when, how much)
- Is a category rather than a specific instance ("exercise" vs "run 2 miles")

WHEN SUGGESTING REWRITES:
- Provide exactly 1 rewrite_option when needs_refinement
- The rewrite should be a COMPLETE, ready-to-use replacement
- best_guess_refinement should be your single best rewrite of their input

RESPONSE FORMAT: Always return valid JSON with this exact structure:
{"status": "ok" or "needs_refinement", "issues": ["one short issue max 10 words"], "rewrite_options": ["one complete rewrite"], "clarifying_questions": ["one question if helpful"], "best_guess_refinement": "your best single rewrite or null if ok", "confidence": 0.0-1.0}

Keep tone neutral and helpful. Never judge. Just detect clarity."""

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
        return f"""STEP: Goal Definition
{context_str}
USER INPUT: "{input_text}"

CLARITY CHECK:
1. Is this exactly ONE goal (not multiple goals joined by "and")?
2. Is it specific and observable (not vague like "be better")?
3. Is it measurable (you could verify if it happened)?
4. Is it an action/outcome (not a feeling like "feel happier")?

NEEDS REFINEMENT IF:
- Multiple goals: "exercise and eat healthy" → pick ONE
- Too vague: "improve", "be better", "get healthier"
- Just a category: "exercise" → needs specifics (what, how often)
- A feeling: "be happier", "feel confident"
- Too short (under 5 words)

EXAMPLES:
❌ "Be healthier" → ✅ "Walk 30 minutes every morning"
❌ "Learn stuff" → ✅ "Complete one Python course by March"
❌ "Exercise and read more" → ✅ "Run 3 times per week" (pick ONE)
❌ "Get better at guitar" → ✅ "Practice guitar 20 minutes daily"

Return JSON with status, issues, rewrite_options (1 complete alternative), best_guess_refinement, confidence."""

    elif step == "why":
        input_text = user_input.get("why", "")
        return f"""STEP: Why This Matters
{context_str}
USER INPUT: "{input_text}"

CLARITY CHECK:
1. Is this a personal, genuine reason (not generic)?
2. Does it connect to something they actually care about?
3. Is it specific enough to motivate action?

NEEDS REFINEMENT IF:
- Generic: "because I should", "it's important", "everyone does it"
- External pressure only: "my doctor said so", "to impress others"
- Too vague: "to be better", "for my health"
- Too short (under 5 words)

EXAMPLES:
❌ "To be healthier" → ✅ "So I can play with my kids without getting winded"
❌ "Because I should" → ✅ "To prove to myself I can stick with something"
❌ "For my career" → ✅ "To get promoted to senior developer by next year"

Return JSON with status, issues, rewrite_options (1 complete alternative), best_guess_refinement, confidence."""

    elif step == "boundaries":
        chips = user_input.get("chips", [])
        custom = user_input.get("custom", "")
        return f"""STEP: Boundaries (What They Won't Sacrifice)
{context_str}
Selected preset boundaries: {chips}
Custom boundary: "{custom}"

CLARITY CHECK:
1. Has at least one boundary been set?
2. Are boundaries specific (not vague)?

NEEDS REFINEMENT IF:
- No boundaries selected AND no custom boundary
- Custom boundary is vague: "don't overdo it"

EXAMPLES:
❌ No boundaries → ✅ Select "No burnout" or "No losing sleep"
❌ "Be balanced" → ✅ "No working past 8pm"

If they have at least one clear boundary, status should be "ok".

Return JSON with status, issues, rewrite_options, best_guess_refinement, confidence."""

    elif step == "minimum_action":
        text = user_input.get("text", "")
        minutes = user_input.get("minutes", 0)
        return f"""STEP: Minimum Action (Smallest Step on a Bad Day)
{context_str}
USER INPUT: "{text}"
MINUTES: {minutes}

CLARITY CHECK:
1. Is this ONE specific physical action (not multiple)?
2. Is it truly minimal (doable in 2-10 minutes)?
3. Could they do it even when exhausted, sick, or stressed?
4. Is it concrete (observable first step)?

NEEDS REFINEMENT IF:
- Multiple actions: "read and take notes" → pick ONE
- Too big: "work out for an hour", "finish the chapter"
- Too vague: "do something", "try", "work on it"
- Not physical/observable: "think about it", "feel motivated"
- Minutes > 15 (too ambitious for a bad day)

EXAMPLES:
❌ "Exercise" → ✅ "Put on running shoes and step outside"
❌ "Read a chapter" → ✅ "Open the book and read one page"
❌ "Study Spanish" → ✅ "Open Duolingo and complete one lesson"
❌ "Work on project" → ✅ "Open the file and write one sentence"

Return JSON with status, issues, rewrite_options (1 complete alternative), best_guess_refinement, confidence."""

    return ""

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
    Detects if input is clear, singular, and actionable.
    Suggests specific rewrites when refinement is needed.
    """
    prompt = get_step_prompt(step, user_input, context)
    
    # Try LLM call
    for attempt in range(2 if retry else 1):
        response_text = await call_llm(prompt, SYSTEM_PROMPT)
        
        if response_text:
            parsed = extract_json_from_response(response_text)
            if parsed:
                try:
                    # Validate with Pydantic
                    result = RealityCheckResponse(
                        status=parsed.get("status", "ok"),
                        issues=parsed.get("issues", [])[:4],
                        rewrite_options=parsed.get("rewrite_options", [])[:1],
                        clarifying_questions=parsed.get("clarifying_questions", [])[:2],
                        best_guess_refinement=parsed.get("best_guess_refinement"),
                        confidence=min(1.0, max(0.0, float(parsed.get("confidence", 0.7)))),
                        debug={"model_used": "gemini", "fallback_used": False}
                    )
                    
                    # Ensure needs_refinement has exactly 1 rewrite option
                    if result.status == "needs_refinement" and len(result.rewrite_options) == 0:
                        result.rewrite_options = ["Be more specific about what you'll do"]
                    result.rewrite_options = result.rewrite_options[:1]
                    
                    return result
                except Exception:
                    # Silent fail - will retry or use fallback
                    continue
    
    # Fallback to stub (deterministic clarity detection)
    return stub_reality_check(step, user_input, context)
