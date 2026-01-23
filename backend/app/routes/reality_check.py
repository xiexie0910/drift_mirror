"""
Reality Check API Routes
============================================================
Provides both legacy per-field validation and new full-payload assessment.
Also includes Agent B for minimum action generation and accountability suggestions.
"""
from fastapi import APIRouter
from app.services.reality_check import (
    RealityCheckRequest,
    RealityCheckResponse,
    run_reality_check
)
from app.services.goal_assessment import (
    AssessmentRequest,
    AssessmentResponse,
    assess_questionnaire
)
from app.services.onboarding_agents import (
    generate_minimum_actions,
    generate_accountability_suggestions
)
from app.schemas import OnboardingAgentRequest, OnboardingAgentResponse

router = APIRouter()

# ============================================================
# New Full-Payload Assessment Endpoint (Agent A)
# ============================================================

@router.post("/assess/", response_model=AssessmentResponse)
async def assess_goal(request: AssessmentRequest) -> AssessmentResponse:
    """
    Full-payload assessment of questionnaire data.
    Returns goal type classification, clarity signals, and flags.
    """
    return await assess_questionnaire(payload=request.payload)


# ============================================================
# Agent B: Generate Minimum Actions + Accountability Suggestions
# ============================================================

@router.post("/generate-options/", response_model=OnboardingAgentResponse)
async def generate_onboarding_options(request: OnboardingAgentRequest) -> OnboardingAgentResponse:
    """
    Generate personalized minimum action options and accountability suggestions.
    Called after Agent A approves the goal.
    """
    # Run both agents in parallel for faster response
    min_actions = await generate_minimum_actions(
        goal=request.goal,
        why=request.why or "",
        boundaries=request.boundaries,
        frequency=request.frequency
    )
    
    accountability = await generate_accountability_suggestions(
        goal=request.goal,
        why=request.why or "",
        boundaries=request.boundaries
    )
    
    return OnboardingAgentResponse(
        minimum_actions=min_actions.minimum_actions,
        accountability_suggestions=accountability.suggestions
    )


# ============================================================
# Legacy Per-Field Validation Endpoint (kept for backward compatibility)
# ============================================================

@router.post("/", response_model=RealityCheckResponse)
async def reality_check(request: RealityCheckRequest) -> RealityCheckResponse:
    """
    Legacy: Assess user input at each onboarding step.
    Returns status (ok/needs_refinement), issues, rewrite options, and clarifying questions.
    """
    return await run_reality_check(
        step=request.step,
        user_input=request.user_input,
        context=request.goal_contract_so_far
    )
