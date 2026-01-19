from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
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
    created_at = Column(DateTime, default=datetime.utcnow)
    
    plans = relationship("Plan", back_populates="resolution", order_by="Plan.version")
    checkins = relationship("Checkin", back_populates="resolution", order_by="Checkin.created_at.desc()")

class Plan(Base):
    __tablename__ = "plans"
    
    id = Column(Integer, primary_key=True, index=True)
    resolution_id = Column(Integer, ForeignKey("resolutions.id"), nullable=False)
    version = Column(Integer, default=1)
    frequency_per_week = Column(Integer, nullable=False)
    min_minutes = Column(Integer, nullable=False)
    time_window = Column(String(50), nullable=False)
    recovery_step = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    resolution = relationship("Resolution", back_populates="plans")

class Checkin(Base):
    __tablename__ = "checkins"
    
    id = Column(Integer, primary_key=True, index=True)
    resolution_id = Column(Integer, ForeignKey("resolutions.id"), nullable=False)
    planned = Column(Text, nullable=False)
    actual = Column(Text, nullable=False)
    blocker = Column(Text, nullable=True)
    completed = Column(Boolean, default=False)
    friction = Column(Integer, default=2)  # 1-3
    created_at = Column(DateTime, default=datetime.utcnow)
    
    resolution = relationship("Resolution", back_populates="checkins")
    signals = relationship("Signal", back_populates="checkin")

class Signal(Base):
    __tablename__ = "signals"
    
    id = Column(Integer, primary_key=True, index=True)
    checkin_id = Column(Integer, ForeignKey("checkins.id"), nullable=False)
    signal_type = Column(String(50), nullable=False)  # blocker, friction, gap, success
    content = Column(Text, nullable=False)
    severity = Column(Float, default=0.5)  # 0-1
    created_at = Column(DateTime, default=datetime.utcnow)
    
    checkin = relationship("Checkin", back_populates="signals")

class MirrorReport(Base):
    __tablename__ = "mirror_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    resolution_id = Column(Integer, ForeignKey("resolutions.id"), nullable=False)
    findings = Column(JSON, nullable=False)  # [{finding, evidence, order}]
    counterfactual = Column(Text, nullable=True)
    drift_score = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Feedback(Base):
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    mirror_report_id = Column(Integer, ForeignKey("mirror_reports.id"), nullable=False)
    helpful = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
