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
    time_window: str = Field(default="morning", max_length=50)

class ResolutionResponse(BaseModel):
    id: int
    title: str
    why: Optional[str]
    mode: str
    frequency_per_week: int
    min_minutes: int
    time_window: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Plan
class PlanResponse(BaseModel):
    id: int
    version: int
    frequency_per_week: int
    min_minutes: int
    time_window: str
    recovery_step: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Checkin
class CheckinCreate(BaseModel):
    resolution_id: int = Field(..., gt=0)
    planned: str = Field(..., min_length=1, max_length=500)
    actual: str = Field(..., min_length=1, max_length=500)
    blocker: Optional[str] = Field(default=None, max_length=500)
    completed: bool = False
    friction: int = Field(default=2, ge=1, le=3)

class CheckinResponse(BaseModel):
    id: int
    resolution_id: int
    planned: str
    actual: str
    blocker: Optional[str]
    completed: bool
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

class MirrorReportResponse(BaseModel):
    id: int
    findings: List[FindingSchema]
    counterfactual: Optional[str]
    drift_score: float
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
