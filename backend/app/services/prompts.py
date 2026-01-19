SIGNAL_EXTRACTOR_SYSTEM = """You are a signal extraction agent. Analyze check-ins and extract meaningful signals.
Output ONLY valid JSON with no extra text."""

SIGNAL_EXTRACTOR_PROMPT = """Analyze this check-in and extract signals:

Planned: {planned}
Actual: {actual}
Blocker: {blocker}
Completed: {completed}
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
- "gap": difference between planned vs actual
- "success": positive completion or progress
- Max 3 signals
- severity: 0=minor, 1=major

Output only the JSON."""

MIRROR_COMPOSER_SYSTEM = """You are a reflection agent. Create insightful, non-judgmental mirror reports.
Output ONLY valid JSON with no extra text."""

MIRROR_COMPOSER_PROMPT = """Create a mirror report based on these signals from recent check-ins:

Goal: {goal_title}
Goal Why: {goal_why}
Current Plan: {frequency}/week, {min_minutes} min, {time_window}

Recent Signals:
{signals_text}

Drift Score: {drift_score:.2f} (0=on track, 1=significant drift)

Create a mirror report in this exact JSON format:
{{
  "findings": [
    {{
      "finding": "observation in neutral tone",
      "evidence": ["quote or data point 1", "quote or data point 2"],
      "order": 1
    }}
  ],
  "counterfactual": "Based on your pattern, you likely could have [specific achievable outcome] if [small change]. This was within reach."
}}

Rules:
- Max 3 findings
- order: 1=first-order (direct observation), 2=second-order (pattern/implication)
- Neutral, supportive tone
- Counterfactual should be specific and quantified if possible
- Use "based on" and "likely" phrasing

Output only the JSON."""
