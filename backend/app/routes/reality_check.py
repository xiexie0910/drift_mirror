"""
Reality Check API Routes
============================================================
Provides both legacy per-field validation and new full-payload assessment.
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
from app.services.resource_discovery import (
    ResourceDiscoveryRequest,
    ResourceDiscoveryResponse,
    discover_resources
)

router = APIRouter()

# ============================================================
# New Full-Payload Assessment Endpoint (Agent A)
# ============================================================

@router.post("/assess/", response_model=AssessmentResponse)
async def assess_goal(request: AssessmentRequest) -> AssessmentResponse:
    """
    Full-payload assessment of questionnaire data.
    Returns goal type classification, clarity signals, flags, and next-step recommendations.
    """
    return await assess_questionnaire(payload=request.payload)


# ============================================================
# Resource Discovery Endpoint (Agent B)
# ============================================================

@router.post("/discover/", response_model=ResourceDiscoveryResponse)
async def discover_goal_resources(request: ResourceDiscoveryRequest) -> ResourceDiscoveryResponse:
    """
    Resource discovery for goals where user doesn't know how to start.
    Returns roadmap, resources, and candidate minimum actions.
    """
    return await discover_resources(
        payload=request.payload,
        goal_type=request.goal_type
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
