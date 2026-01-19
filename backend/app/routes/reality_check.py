"""
Reality Check API Routes
"""
from fastapi import APIRouter
from app.services.reality_check import (
    RealityCheckRequest,
    RealityCheckResponse,
    run_reality_check
)

router = APIRouter()

@router.post("/", response_model=RealityCheckResponse)
async def reality_check(request: RealityCheckRequest) -> RealityCheckResponse:
    """
    Assess user input at each onboarding step.
    Returns status (ok/needs_refinement), issues, rewrite options, and clarifying questions.
    """
    return await run_reality_check(
        step=request.step,
        user_input=request.user_input,
        context=request.goal_contract_so_far
    )
