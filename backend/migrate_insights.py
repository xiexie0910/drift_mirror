#!/usr/bin/env python3
"""
Database Migration Script - Actionable Insights Feature
Adds insight_actions table and actionable_suggestions column
"""

import sqlite3
import sys
from pathlib import Path

def apply_migration(db_path: str = "drift_mirror.db"):
    """Apply the migration to add actionable insights feature"""
    
    # Check if database exists
    if not Path(db_path).exists():
        print(f"Error: Database file not found at {db_path}")
        print("Please ensure you're running this from the backend directory.")
        sys.exit(1)
    
    print(f"Applying migration to {db_path}...")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if actionable_suggestions column already exists
        cursor.execute("PRAGMA table_info(mirror_reports)")
        columns = [col[1] for col in cursor.fetchall()]
        
        if 'actionable_suggestions' not in columns:
            print("  → Adding actionable_suggestions column to mirror_reports...")
            cursor.execute("""
                ALTER TABLE mirror_reports 
                ADD COLUMN actionable_suggestions JSON NULL
            """)
            print("  ✓ Column added successfully")
        else:
            print("  ℹ actionable_suggestions column already exists, skipping")
        
        # Check if insight_actions table already exists
        cursor.execute("""
            SELECT name FROM sqlite_master 
            WHERE type='table' AND name='insight_actions'
        """)
        
        if not cursor.fetchone():
            print("  → Creating insight_actions table...")
            cursor.execute("""
                CREATE TABLE insight_actions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    resolution_id INTEGER NOT NULL,
                    mirror_report_id INTEGER NULL,
                    insight_type VARCHAR(50) NOT NULL,
                    insight_summary TEXT NOT NULL,
                    action_taken VARCHAR(50) NOT NULL,
                    constraint_details TEXT NULL,
                    suggested_changes JSON NULL,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (resolution_id) REFERENCES resolutions(id) ON DELETE CASCADE,
                    FOREIGN KEY (mirror_report_id) REFERENCES mirror_reports(id) ON DELETE CASCADE
                )
            """)
            print("  ✓ Table created successfully")
            
            # Create indexes
            print("  → Creating indexes...")
            cursor.execute("""
                CREATE INDEX idx_insight_actions_resolution 
                ON insight_actions(resolution_id)
            """)
            cursor.execute("""
                CREATE INDEX idx_insight_actions_mirror_report 
                ON insight_actions(mirror_report_id)
            """)
            cursor.execute("""
                CREATE INDEX idx_insight_actions_type 
                ON insight_actions(insight_type)
            """)
            cursor.execute("""
                CREATE INDEX idx_insight_actions_action 
                ON insight_actions(action_taken)
            """)
            cursor.execute("""
                CREATE INDEX idx_insight_actions_created 
                ON insight_actions(created_at DESC)
            """)
            print("  ✓ Indexes created successfully")
        else:
            print("  ℹ insight_actions table already exists, skipping")
        
        conn.commit()
        print("\n✅ Migration completed successfully!")
        print("\nNew features added:")
        print("  • InsightAction table to track user choices on patterns")
        print("  • actionable_suggestions column in MirrorReport")
        print("  • API endpoints for insight actions at /resolutions/{id}/insights/actions")
        
    except sqlite3.Error as e:
        print(f"\n❌ Migration failed: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()

if __name__ == "__main__":
    db_file = sys.argv[1] if len(sys.argv) > 1 else "drift_mirror.db"
    apply_migration(db_file)
