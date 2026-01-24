-- Migration: Add actionable insights feature
-- Date: 2026-01-24
-- Description: Adds InsightAction table and actionable_suggestions column to MirrorReport

-- Add actionable_suggestions column to mirror_reports table
ALTER TABLE mirror_reports 
ADD COLUMN actionable_suggestions JSON NULL;

-- Create insight_actions table to track user actions on patterns
CREATE TABLE IF NOT EXISTS insight_actions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    resolution_id INTEGER NOT NULL,
    mirror_report_id INTEGER NULL,
    insight_type VARCHAR(50) NOT NULL,  -- 'pattern', 'drift', 'mirror', 'time_preference'
    insight_summary TEXT NOT NULL,
    action_taken VARCHAR(50) NOT NULL,  -- 'adopt', 'constrain', 'ignore'
    constraint_details TEXT NULL,
    suggested_changes JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (resolution_id) REFERENCES resolutions(id) ON DELETE CASCADE,
    FOREIGN KEY (mirror_report_id) REFERENCES mirror_reports(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_insight_actions_resolution ON insight_actions(resolution_id);
CREATE INDEX idx_insight_actions_mirror_report ON insight_actions(mirror_report_id);
CREATE INDEX idx_insight_actions_type ON insight_actions(insight_type);
CREATE INDEX idx_insight_actions_action ON insight_actions(action_taken);
CREATE INDEX idx_insight_actions_created ON insight_actions(created_at DESC);
