SIGNAL_EXTRACTOR_SYSTEM = """You are a signal extraction agent. Analyze check-ins and extract meaningful signals.
Output ONLY valid JSON with no extra text."""

SIGNAL_EXTRACTOR_PROMPT = """Analyze this check-in and extract signals:

Did minimum action: {did_minimum}
Extra done: {extra_done}
Blocker: {blocker}
Friction: {friction}/3

Extract signals in this exact JSON format:
{{
  "signals": [
    {{
      "signal_type": "blocker|friction|gap|success",
      "content": "brief description",
      "severity": 0.0-1.0
    }}
  ]
}}

Rules:
- "blocker": external obstacles mentioned
- "friction": internal resistance (high friction score)
- "gap": did not complete minimum action
- "success": completed minimum or did extra
- Max 3 signals
- severity: 0=minor, 1=major

Output only the JSON."""

MIRROR_COMPOSER_SYSTEM = """You are a reflection agent. Create insightful, personalized, non-judgmental mirror reports.
You must quote the user's own words when making observations.
Output ONLY valid JSON with no extra text."""

MIRROR_COMPOSER_PROMPT = """Create a personalized mirror report based on these check-ins:

Goal: {goal_title}
Goal Why: {goal_why}
Current Plan: {frequency}/week, {min_minutes} min minimum

Recent Check-in Details (most recent first):
{checkin_details}

Extracted Signals:
{signals_text}

Drift Score: {drift_score:.2f} (0=on track, 1=significant drift)
Weekly Stats: {this_week_count}/{target_frequency} check-ins this week, trend: {trend}

Create a mirror report in this exact JSON format:
{{
  "findings": [
    {{
      "finding": "specific observation that quotes their words, e.g. 'You mentioned being exhausted after work in 3 of 5 check-ins'",
      "evidence": ["Jan 24: 'their exact words here'", "Pattern: X of Y times..."],
      "order": 1,
      "root_cause_hypothesis": "possible underlying reason - e.g. 'This isn't a motivation problem, it's a timing mismatch'"
    }}
  ],
  "counterfactual": "You mentioned '[specific blocker from their words]' on [X] occasions. If you had [specific small change], you could likely have completed [X of Y] sessions instead of [current]. For example, [concrete scenario using their situation].",
  "recurring_blockers": ["energy/fatigue (mentioned X times)", "time constraints (mentioned X times)"],
  "strength_pattern": "What's working well - e.g. 'When you do start, you often exceed your minimum'"
}}

CRITICAL RULES:
- QUOTE their actual words in "quotes" in findings and evidence
- Be SPECIFIC: use numbers, dates, and their exact phrases
- root_cause_hypothesis should explain WHY this is happening (timing, energy, environment, etc.)
- Counterfactual MUST include: their quoted blocker + specific change + quantified outcome + concrete example
- recurring_blockers: list blockers mentioned 2+ times with count
- strength_pattern: always include something positive from their data
- Max 3 findings, ordered by importance
- Neutral, supportive tone - never judgmental

Output only the JSON."""

# ============================================================
# Progress Summary Prompts
# ============================================================

PROGRESS_SUMMARY_SYSTEM = """You are a supportive progress coach. Analyze a user's check-in notes over time and provide an encouraging, insightful summary of their journey.
Output ONLY valid JSON with no extra text."""

PROGRESS_SUMMARY_PROMPT = """Analyze this user's progress journey toward their goal:

Goal: {goal_title}
Why: {goal_why}
Days tracked: {days_tracked}
Total check-ins: {total_checkins}
Completion rate: {completion_rate}%

Their check-in notes over time (oldest to newest):
{notes_timeline}

Create a progress summary in this exact JSON format:
{{
  "overall_progress": "A 2-3 sentence encouraging summary of their journey",
  "key_wins": ["specific achievement 1", "specific achievement 2", "specific achievement 3"],
  "growth_observed": "What growth or improvement pattern you see in their notes",
  "encouragement": "A personalized, specific encouragement message",
  "days_to_habit": {days_to_habit}
}}

Rules:
- Be warm, specific, and encouraging
- Reference specific things they mentioned in their notes
- key_wins should be concrete achievements from their notes (max 3)
- growth_observed should note any progression or improvement you see
- days_to_habit is how many days until they hit 90 days (the habit formation threshold)
- If they have few check-ins, focus on celebrating that they started

Output only the JSON."""

# ============================================================
# Minimum Action Generator Prompts (Agent B)
# ============================================================

MINIMUM_ACTION_GENERATOR_SYSTEM = """You are a behavioral design expert. Generate small, friction-free minimum actions that make it easy to start.
Output ONLY valid JSON with no extra text."""

MINIMUM_ACTION_GENERATOR_PROMPT = """Generate 6 minimum action options for this user's goal:

Goal: {goal}
Why: {why}
Boundaries: {boundaries}
Frequency: {frequency}x per week

A minimum action is the SMALLEST possible step they can take on their WORST day (tired, busy, unmotivated).

Rules for minimum actions:
1. Must be completable in 2-10 minutes
2. Must be ONE physical, observable action (not multiple steps)
3. Must require zero motivation to start
4. Must be specific and concrete (not vague)
5. Should be the "foot in the door" that often leads to more

Generate 6 options in this exact JSON format:
{{
  "minimum_actions": [
    {{
      "text": "Put on running shoes and step outside",
      "minutes": 2,
      "rationale": "Just getting dressed removes the biggest barrier"
    }},
    {{
      "text": "Do 5 jumping jacks",
      "minutes": 1,
      "rationale": "Movement creates momentum"
    }}
  ]
}}

Make each option progressively slightly bigger (from ~2 min to ~10 min).
Output only the JSON."""

# ============================================================
# Accountability Suggestion Prompts
# ============================================================

ACCOUNTABILITY_SUGGESTIONS_SYSTEM = """You are a habit formation expert. Suggest personalized accountability strategies.
Output ONLY valid JSON with no extra text."""

ACCOUNTABILITY_SUGGESTIONS_PROMPT = """Suggest 5 accountability strategies for this user's goal:

Goal: {goal}
Why: {why}
Boundaries: {boundaries}

Generate strategies that help people stay committed through social connection, environment design, or commitment devices.

Generate suggestions in this exact JSON format:
{{
  "suggestions": [
    {{
      "text": "Find a workout buddy to go to the gym with",
      "type": "social",
      "rationale": "Social commitment makes skipping harder"
    }},
    {{
      "text": "Join a local running club",
      "type": "community",
      "rationale": "Group identity reinforces habit"
    }}
  ]
}}

Types: "social" (with a friend), "community" (join a group), "environment" (set up your space), "commitment" (public commitment), "tracking" (visible progress)

Output only the JSON."""
