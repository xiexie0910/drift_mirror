from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db import Base

class Resolution(Base):
    __tablename__ = "resolutions"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    why = Column(Text, nullable=True)
    mode = Column(String(50), default="personal_growth")  # personal_growth or productivity
    frequency_per_week = Column(Integer, default=3)
    min_minutes = Column(Integer, default=15)
    time_window = Column(String(50), default="morning")  # morning/afternoon/evening/night
    minimum_action_text = Column(Text, nullable=True)  # The user's minimum daily action
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    plans = relationship("Plan", back_populates="resolution", order_by="Plan.version")
    checkins = relationship("Checkin", back_populates="resolution", order_by="Checkin.created_at.desc()")
    diary_entries = relationship("DiaryEntry", back_populates="resolution", order_by="DiaryEntry.entry_date.desc()")
    quarterly_reviews = relationship("QuarterlyReview", back_populates="resolution", order_by="QuarterlyReview.quarter_number")

class Plan(Base):
    __tablename__ = "plans"
    
    id = Column(Integer, primary_key=True, index=True)
    resolution_id = Column(Integer, ForeignKey("resolutions.id"), nullable=False)
    version = Column(Integer, default=1)
    frequency_per_week = Column(Integer, nullable=False)
    min_minutes = Column(Integer, nullable=False)
    time_window = Column(String(50), nullable=False)
    recovery_step = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    resolution = relationship("Resolution", back_populates="plans")

class Checkin(Base):
    __tablename__ = "checkins"
    
    id = Column(Integer, primary_key=True, index=True)
    resolution_id = Column(Integer, ForeignKey("resolutions.id"), nullable=False)
    planned = Column(Text, nullable=False)
    actual = Column(Text, nullable=False)
    blocker = Column(Text, nullable=True)
    completed = Column(Boolean, default=False)
    did_minimum_action = Column(Boolean, default=False)  # Did they do at least their minimum?
    extra_done = Column(Text, nullable=True)  # What extra they did beyond minimum
    friction = Column(Integer, default=2)  # 1-3
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    resolution = relationship("Resolution", back_populates="checkins")
    signals = relationship("Signal", back_populates="checkin")

class Signal(Base):
    __tablename__ = "signals"
    
    id = Column(Integer, primary_key=True, index=True)
    checkin_id = Column(Integer, ForeignKey("checkins.id"), nullable=False)
    signal_type = Column(String(50), nullable=False)  # blocker, friction, gap, success
    content = Column(Text, nullable=False)
    severity = Column(Float, default=0.5)  # 0-1
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    checkin = relationship("Checkin", back_populates="signals")

class MirrorReport(Base):
    __tablename__ = "mirror_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    resolution_id = Column(Integer, ForeignKey("resolutions.id"), nullable=False)
    findings = Column(JSON, nullable=False)  # [{finding, evidence, order}]
    counterfactual = Column(Text, nullable=True)
    drift_score = Column(Float, nullable=False)
    actionable_suggestions = Column(JSON, nullable=True)  # [{type, suggestion, changes: {field: value}}]
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    mirror_report_id = Column(Integer, ForeignKey("mirror_reports.id"), nullable=False)
    helpful = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class InsightAction(Base):
    """
    User actions taken on patterns/insights detected by the system.
    Stores user choices to adopt suggestions, add constraints, or ignore patterns.
    """
    __tablename__ = "insight_actions"
    
    id = Column(Integer, primary_key=True, index=True)
    resolution_id = Column(Integer, ForeignKey("resolutions.id"), nullable=False)
    mirror_report_id = Column(Integer, ForeignKey("mirror_reports.id"), nullable=True)  # Optional: link to specific mirror report
    insight_type = Column(String(50), nullable=False)  # "pattern", "drift", "mirror", "time_preference"
    insight_summary = Column(Text, nullable=False)  # Brief summary of the insight user acted on
    action_taken = Column(String(50), nullable=False)  # "adopt", "constrain", "ignore"
    constraint_details = Column(Text, nullable=True)  # User-specified constraint when action="constrain"
    suggested_changes = Column(JSON, nullable=True)  # What was suggested (e.g., {"time_window": "evening", "frequency_per_week": 2})
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


# ============================================================
# Diary Feature - Progress Tracking
# ============================================================

class DiaryEntry(Base):
    """
    Daily diary entries for tracking progress and stories.
    Users can optionally write reflections for each day.
    These entries contribute to the 90-day quarterly review.
    """
    __tablename__ = "diary_entries"
    
    id = Column(Integer, primary_key=True, index=True)
    resolution_id = Column(Integer, ForeignKey("resolutions.id"), nullable=False)
    entry_date = Column(DateTime, nullable=False)  # The date this entry is for
    content = Column(Text, nullable=False)  # The diary entry text
    mood = Column(String(20), nullable=True)  # Optional: great/good/okay/tough
    wins = Column(Text, nullable=True)  # What went well today
    challenges = Column(Text, nullable=True)  # What was difficult
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    resolution = relationship("Resolution", back_populates="diary_entries")


class QuarterlyReview(Base):
    """
    90-day review summaries.
    Research shows that 90 days is the threshold for habit formation.
    These reviews help users see their progress and reinforce habits.
    """
    __tablename__ = "quarterly_reviews"
    
    id = Column(Integer, primary_key=True, index=True)
    resolution_id = Column(Integer, ForeignKey("resolutions.id"), nullable=False)
    quarter_number = Column(Integer, nullable=False)  # 1, 2, 3, 4...
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    
    # Metrics summary
    total_checkins = Column(Integer, default=0)
    completion_rate = Column(Float, default=0.0)
    average_friction = Column(Float, default=0.0)
    diary_entries_count = Column(Integer, default=0)
    
    # Qualitative summary
    key_wins = Column(JSON, nullable=True)  # List of major achievements
    patterns_observed = Column(JSON, nullable=True)  # Behavioral patterns
    growth_areas = Column(Text, nullable=True)  # AI-generated insights
    
    # User reflection (filled by user)
    user_reflection = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    
    resolution = relationship("Resolution", back_populates="quarterly_reviews")
