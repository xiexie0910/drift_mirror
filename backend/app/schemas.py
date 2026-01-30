from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# Resolution
class ResolutionCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    why: Optional[str] = Field(default=None, max_length=500)
    mode: str = Field(default="personal_growth", max_length=50)
    frequency_per_week: int = Field(default=3, ge=1, le=7)
    min_minutes: int = Field(default=15, ge=1, le=120)
    minimum_action_text: Optional[str] = Field(default=None, max_length=300)

class ResolutionResponse(BaseModel):
    id: int
    title: str
    why: Optional[str]
    mode: str
    frequency_per_week: int
    min_minutes: int
    minimum_action_text: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Plan
class PlanResponse(BaseModel):
    id: int
    version: int
    frequency_per_week: int
    min_minutes: int
    recovery_step: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Checkin
class CheckinCreate(BaseModel):
    resolution_id: int = Field(..., gt=0)
    did_minimum_action: bool = Field(default=False)
    extra_done: Optional[str] = Field(default=None, max_length=500)
    blocker: Optional[str] = Field(default=None, max_length=500)
    friction: int = Field(default=2, ge=1, le=3)

class CheckinResponse(BaseModel):
    id: int
    resolution_id: int
    planned: str
    actual: str
    blocker: Optional[str]
    completed: bool
    did_minimum_action: bool
    extra_done: Optional[str]
    friction: int
    created_at: datetime
    
    class Config:
        from_attributes = True

# Signal
class SignalResponse(BaseModel):
    id: int
    signal_type: str
    content: str
    severity: float
    
    class Config:
        from_attributes = True

# Mirror
class FindingSchema(BaseModel):
    finding: str
    evidence: List[str]
    order: int  # 1=first-order, 2=second-order
    root_cause_hypothesis: Optional[str] = None  # Why this pattern exists

class MirrorReportResponse(BaseModel):
    id: int
    findings: List[FindingSchema]
    counterfactual: Optional[str]
    drift_score: float
    actionable_suggestions: Optional[List[dict]] = None
    recurring_blockers: Optional[List[str]] = None  # Blockers mentioned 2+ times
    strength_pattern: Optional[str] = None  # What's working well
    created_at: datetime
    
    class Config:
        from_attributes = True

# Dashboard
class MetricsResponse(BaseModel):
    completion_rate: float
    streak: int
    avg_friction: float
    drift_score: float
    total_checkins: int
    minimum_action_streak: int  # Consecutive check-ins where did_minimum_action=True
    minimum_action_rate: float  # % of check-ins with did_minimum_action=True
    # Weekly frequency tracking
    this_week_count: int = 0  # Check-ins completed this week
    target_frequency: int = 3  # Target check-ins per week
    # Minimum Action Scaling
    suggest_momentum_minimum: bool = False
    momentum_suggestion_text: Optional[str] = None
    active_minimum_level: str = "base"  # "base" or "momentum"

class DashboardResponse(BaseModel):
    resolution: Optional[ResolutionResponse]
    current_plan: Optional[PlanResponse]
    recent_checkins: List[CheckinResponse]
    metrics: MetricsResponse
    latest_mirror: Optional[MirrorReportResponse]
    drift_triggered: bool

# Debug
class DebugPayload(BaseModel):
    signals: List[SignalResponse]
    rules_applied: List[str]
    raw_json: dict

# Feedback
class FeedbackCreate(BaseModel):
    mirror_report_id: int
    helpful: bool

# Insight Actions
class InsightActionCreate(BaseModel):
    """User action taken on a detected pattern or insight."""
    resolution_id: int = Field(..., gt=0)
    mirror_report_id: Optional[int] = Field(default=None, gt=0)
    insight_type: str = Field(..., pattern="^(pattern|drift|mirror|time_preference)$")
    insight_summary: str = Field(..., min_length=1, max_length=500)
    action_taken: str = Field(..., pattern="^(accept|constrain|ignore)$")
    constraint_details: Optional[str] = Field(default=None, max_length=1000)
    suggested_changes: Optional[dict] = None  # JSON structure for suggested changes

class InsightActionResponse(BaseModel):
    """Response for an insight action."""
    id: int
    resolution_id: int
    mirror_report_id: Optional[int]
    insight_type: str
    insight_summary: str
    action_taken: str
    constraint_details: Optional[str]
    suggested_changes: Optional[dict]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================
# Progress Summary Schemas
# ============================================================

class ProgressSummaryResponse(BaseModel):
    """Response for AI-generated progress summary."""
    overall_progress: str
    key_wins: List[str]
    growth_observed: str
    encouragement: str
    days_to_habit: int  # Days until 90-day habit milestone


# ============================================================
# Onboarding Agent Schemas (Agent B)
# ============================================================

class MinimumActionOption(BaseModel):
    """A single minimum action option."""
    text: str
    minutes: int
    rationale: str

class MinimumActionsResponse(BaseModel):
    """Response with 6 minimum action options."""
    minimum_actions: List[MinimumActionOption]

class AccountabilitySuggestion(BaseModel):
    """A single accountability suggestion."""
    text: str
    type: str  # social, community, environment, commitment, tracking
    rationale: str

class AccountabilitySuggestionsResponse(BaseModel):
    """Response with accountability suggestions."""
    suggestions: List[AccountabilitySuggestion]

class OnboardingAgentRequest(BaseModel):
    """Request for onboarding agents (minimum actions + accountability)."""
    goal: str = Field(..., min_length=1, max_length=500)
    why: Optional[str] = Field(default=None, max_length=500)
    boundaries: List[str] = Field(default_factory=list)
    frequency: int = Field(default=3, ge=1, le=7)

class OnboardingAgentResponse(BaseModel):
    """Combined response from onboarding agents."""
    minimum_actions: List[MinimumActionOption]
    accountability_suggestions: List[AccountabilitySuggestion]
