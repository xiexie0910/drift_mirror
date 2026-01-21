from typing import List, Dict, TYPE_CHECKING

if TYPE_CHECKING:
    from app.services.goal_assessment import QuestionnairePayload, AssessmentResponse

def stub_extract_signals(planned: str, actual: str, blocker: str, completed: bool, friction: int) -> List[Dict]:
    """Deterministic fallback for signal extraction."""
    signals = []
    
    # Gap detection
    if planned.lower() != actual.lower() and len(actual) > 0:
        signals.append({
            "signal_type": "gap",
            "content": f"Planned '{planned[:50]}' but did '{actual[:50]}'",
            "severity": 0.4
        })
    
    # Blocker detection
    if blocker:
        signals.append({
            "signal_type": "blocker",
            "content": f"Blocked by: {blocker[:100]}",
            "severity": 0.6
        })
    
    # Friction detection
    if friction >= 3:
        signals.append({
            "signal_type": "friction",
            "content": "High friction reported",
            "severity": 0.7
        })
    elif friction == 2 and not completed:
        signals.append({
            "signal_type": "friction",
            "content": "Moderate friction with incomplete task",
            "severity": 0.5
        })
    
    # Success detection
    if completed and friction == 1:
        signals.append({
            "signal_type": "success",
            "content": "Completed with low friction",
            "severity": 0.2
        })
    elif completed:
        signals.append({
            "signal_type": "success",
            "content": "Task completed",
            "severity": 0.3
        })
    
    return signals[:3]

def stub_compose_mirror(
    goal_title: str,
    goal_why: str,
    signals: List[Dict],
    drift_score: float
) -> Dict:
    """Deterministic fallback for mirror composition."""
    findings = []
    evidence = []
    
    # Collect evidence from signals
    for s in signals:
        evidence.append(s["content"])
    
    # Generate findings based on signal types
    signal_types = [s["signal_type"] for s in signals]
    
    if "blocker" in signal_types:
        findings.append({
            "finding": "External obstacles are appearing in your path",
            "evidence": [s["content"] for s in signals if s["signal_type"] == "blocker"][:2],
            "order": 1
        })
    
    if "friction" in signal_types:
        findings.append({
            "finding": "There's some internal resistance showing up",
            "evidence": [s["content"] for s in signals if s["signal_type"] == "friction"][:2],
            "order": 1
        })
    
    if "gap" in signal_types:
        findings.append({
            "finding": "What you planned and what happened are diverging—this is a pattern worth noticing",
            "evidence": [s["content"] for s in signals if s["signal_type"] == "gap"][:2],
            "order": 2
        })
    
    if not findings:
        findings.append({
            "finding": "Your recent activity shows mixed signals",
            "evidence": evidence[:2] if evidence else ["Limited data available"],
            "order": 1
        })
    
    # Generate counterfactual
    counterfactual = "Based on your pattern, you likely could have completed one more session this week if you reduced the session length by 5 minutes. This small adjustment was within reach."
    
    if drift_score > 0.6:
        counterfactual = "Based on your friction levels, you likely could have maintained momentum if sessions were shorter and more frequent. Even 10 minutes done consistently beats 30 minutes skipped."
    
    return {
        "findings": findings[:3],
        "counterfactual": counterfactual
    }


def stub_goal_assessment(payload: "QuestionnairePayload") -> "AssessmentResponse":
    """
    Deterministic fallback for goal assessment when LLM is unavailable.
    Uses simple heuristics to classify and score the questionnaire.
    """
    from app.services.goal_assessment import (
        AssessmentResponse, ClaritySignals, AssessmentFlags, 
        GoalType, RewriteOption
    )
    
    goal = payload.goal.lower().strip()
    # Note: 'why' used for potential future enhancements
    _ = payload.why.lower().strip() if payload.why else ""
    chips = payload.boundaries.chips if payload.boundaries else []
    custom_boundary = payload.boundaries.custom if payload.boundaries else ""
    has_action = payload.minimum_action and payload.minimum_action.text
    action_text = payload.minimum_action.text.lower() if has_action else ""
    action_minutes = payload.minimum_action.minutes if has_action and payload.minimum_action.minutes else 0
    
    # Initialize flags
    flags = AssessmentFlags()
    issues = []
    rewrite_options = []
    
    # ============================================================
    # Goal Type Classification (simple keyword matching)
    # ============================================================
    goal_type = GoalType.OTHER
    learning_keywords = ["learn", "study", "course", "read", "understand", "master", "skill"]
    fitness_keywords = ["run", "exercise", "gym", "workout", "walk", "fitness", "train", "weight", "cardio"]
    creative_keywords = ["write", "draw", "paint", "create", "design", "build", "compose", "art"]
    productivity_keywords = ["organize", "clean", "complete", "finish", "task", "project", "work"]
    health_keywords = ["sleep", "eat", "diet", "meditate", "mindful", "stress", "mental", "health"]
    career_keywords = ["job", "career", "promotion", "salary", "interview", "resume", "linkedin"]
    relationship_keywords = ["friend", "family", "partner", "social", "connect", "relationship"]
    
    if any(kw in goal for kw in learning_keywords):
        goal_type = GoalType.LEARNING
    elif any(kw in goal for kw in fitness_keywords):
        goal_type = GoalType.FITNESS
    elif any(kw in goal for kw in creative_keywords):
        goal_type = GoalType.CREATIVE_OUTPUT
    elif any(kw in goal for kw in productivity_keywords):
        goal_type = GoalType.PRODUCTIVITY
    elif any(kw in goal for kw in health_keywords):
        goal_type = GoalType.HEALTH_WELLBEING
    elif any(kw in goal for kw in career_keywords):
        goal_type = GoalType.CAREER
    elif any(kw in goal for kw in relationship_keywords):
        goal_type = GoalType.RELATIONSHIP
    
    # ============================================================
    # Clarity Signal Scoring
    # ============================================================
    
    # Goal clarity
    clarity = 0.7
    vague_words = ["better", "more", "improve", "stuff", "things", "try", "maybe", "kind of", "somehow"]
    if any(word in goal for word in vague_words):
        clarity -= 0.3
        flags.vague_outcome = True
        issues.append("Goal is too vague - add specifics")
    
    if len(goal.split()) < 4:
        clarity -= 0.2
        issues.append("Goal is too brief")
    
    if len(goal.split()) > 5 and any(char.isdigit() for char in goal):
        clarity += 0.1  # Has numbers, likely specific
    
    # Check for multiple goals
    if " and " in goal and goal.count(" and ") >= 1:
        # Check if it's really multiple goals
        parts = goal.split(" and ")
        if len(parts) >= 2 and all(len(p.strip()) > 3 for p in parts):
            flags.multiple_goals = True
            clarity -= 0.2
            issues.append("Focus on one goal at a time")
    
    # Feeling vs action
    feeling_words = ["feel", "be happy", "be confident", "be better", "less anxious", "more motivated"]
    if any(fw in goal for fw in feeling_words):
        flags.feeling_not_action = True
        clarity -= 0.2
        issues.append("Express this as an action, not a feeling")
    
    clarity = max(0.1, min(1.0, clarity))
    
    # Scope scoring
    scope = 0.7
    broad_words = ["everything", "completely", "transform", "change my life", "total"]
    if any(word in goal for word in broad_words):
        scope -= 0.3
        flags.too_broad = True
        issues.append("Scope is too broad")
    scope = max(0.1, min(1.0, scope))
    
    # Actionability scoring
    actionability = 0.6
    action_verbs = ["run", "write", "read", "walk", "call", "email", "practice", "complete", "finish", "start"]
    if any(verb in goal for verb in action_verbs):
        actionability += 0.2
    if has_action:
        actionability += 0.1
    actionability = max(0.1, min(1.0, actionability))
    
    # Boundaries scoring
    boundaries_score = 0.3  # Base if nothing set
    if len(chips) >= 1:
        boundaries_score = 0.6
    if len(chips) >= 2:
        boundaries_score = 0.8
    if custom_boundary and len(custom_boundary) > 5:
        boundaries_score = min(1.0, boundaries_score + 0.1)
    if not chips and not custom_boundary:
        flags.boundary_missing = True
        issues.append("Set at least one boundary")
    boundaries_score = max(0.1, min(1.0, boundaries_score))
    
    # Minimum action scoring
    action_score = 0.5  # Default if not provided
    if has_action:
        action_score = 0.7
        if action_minutes and action_minutes > 15:
            flags.action_too_big = True
            action_score -= 0.2
            issues.append("Minimum action should be under 15 minutes")
        if " and " in action_text:
            action_score -= 0.2
            issues.append("Minimum action should be one thing")
        if len(action_text.split()) >= 3:
            action_score += 0.1
    else:
        flags.unknown_actions = True
    action_score = max(0.1, min(1.0, action_score))
    
    signals = ClaritySignals(
        clarity=clarity,
        scope=scope,
        actionability=actionability,
        boundaries=boundaries_score,
        minimum_action=action_score
    )
    
    # ============================================================
    # Determine Status & Recommendations
    # ============================================================
    
    # Status: needs_refinement if any major flags or low scores
    avg_score = (clarity + scope + actionability + boundaries_score) / 4
    needs_refinement = (
        flags.vague_outcome or 
        flags.multiple_goals or 
        flags.feeling_not_action or
        flags.too_broad or
        flags.boundary_missing or
        avg_score < 0.5
    )
    
    status = "needs_refinement" if needs_refinement else "ok"
    
    # Resource discovery needed if no minimum action provided
    needs_resource = flags.unknown_actions or not has_action
    
    # ============================================================
    # Generate Smart Rewrites Based on Goal Type
    # ============================================================
    
    if needs_refinement:
        rewrite_text = _generate_smart_rewrite(payload.goal, goal_type, flags)
        if rewrite_text:
            rewrite_options.append(RewriteOption(
                text=rewrite_text,
                field="goal",
                rationale="Made it specific to a concrete activity"
            ))
    
    return AssessmentResponse(
        status=status,
        goal_type=goal_type,
        signals=signals,
        flags=flags,
        issues=issues[:5],
        rewrite_options=rewrite_options[:3],
        needs_resource_discovery=needs_resource,
        suggest_show_rewrite_options=needs_refinement and len(rewrite_options) > 0,
        best_guess_goal=rewrite_options[0].text if rewrite_options else None,
        confidence=0.6,
        debug={"model_used": "stub", "fallback_used": True}
    )


def _generate_smart_rewrite(original_goal: str, goal_type, flags) -> str:
    """Generate a grammatically correct, specific goal rewrite."""
    from app.services.goal_assessment import GoalType
    
    goal_lower = original_goal.lower().strip()
    
    # Goal-type specific templates - ACTIVITY-SPECIFIC, not frequency-based
    # Frequency/scheduling belongs in the roadmap, not the goal
    templates = {
        GoalType.FITNESS: [
            "Go to the gym regularly",
            "Start a running routine",
            "Join a local sports league",
            "Do home workouts using YouTube",
            "Take up swimming at the local pool",
        ],
        GoalType.LEARNING: [
            "Learn through an online course",
            "Study with a structured curriculum",
            "Practice with hands-on projects",
            "Learn by building real applications",
            "Follow a tutorial series to completion",
        ],
        GoalType.CREATIVE_OUTPUT: [
            "Create and publish regularly on a platform",
            "Build a portfolio of work",
            "Join a creative community or group",
            "Start a personal project from scratch",
            "Take a class to improve technique",
        ],
        GoalType.PRODUCTIVITY: [
            "Set up a daily planning system",
            "Use time-blocking for focused work",
            "Implement a task management system",
            "Create a weekly review habit",
            "Build a distraction-free workspace",
        ],
        GoalType.HEALTH_WELLBEING: [
            "Start a morning meditation practice",
            "Improve sleep with a bedtime routine",
            "Take daily walks outside",
            "Practice mindfulness throughout the day",
            "Join a yoga or wellness class",
        ],
        GoalType.CAREER: [
            "Update resume and start applying to jobs",
            "Network within my industry",
            "Pursue a professional certification",
            "Find a mentor in my field",
            "Start a side project to build skills",
        ],
        GoalType.RELATIONSHIP: [
            "Schedule regular quality time with loved ones",
            "Stay in touch with friends more actively",
            "Plan meaningful experiences together",
            "Practice better communication habits",
            "Join social groups to meet new people",
        ],
        GoalType.OTHER: [
            "Work on this consistently",
            "Make steady progress with small steps",
            "Track progress to stay accountable",
            "Find a community or group for support",
            "Break it down into manageable parts",
        ],
    }
    
    # Try to extract specific activity from original goal
    activity_rewrites = {
        "run": "Start a running routine",
        "exercise": "Go to the gym regularly",
        "workout": "Start a home workout routine",
        "read": "Read books regularly",
        "learn": "Learn through structured online courses",
        "study": "Study with a focused curriculum",
        "practice": "Practice consistently with deliberate focus",
        "write": "Start a regular writing practice",
        "code": "Build coding projects to learn by doing",
        "meditate": "Start a daily meditation practice",
        "walk": "Take daily walks outside",
        "sleep": "Improve sleep with a consistent bedtime routine",
        "cook": "Learn to cook at home more often",
        "save": "Set up automatic savings",
        "gym": "Go to the gym regularly",
        "tennis": "Join a tennis club or practice against the wall",
        "basketball": "Play basketball at a local court",
        "guitar": "Learn guitar through lessons or tutorials",
        "piano": "Take piano lessons or use an app",
        "swim": "Take up swimming at the local pool",
        "yoga": "Join a yoga class or follow online sessions",
        "spanish": "Learn Spanish through an app like Duolingo",
        "french": "Learn French through structured lessons",
        "python": "Learn Python through an online course",
        "javascript": "Learn JavaScript by building web projects",
        "full stack": "Learn full stack web development",
        "frontend": "Learn frontend development with React or Vue",
        "backend": "Learn backend development with Node or Python",
    }
    
    # Check for matching activity keywords
    for keyword, rewrite in activity_rewrites.items():
        if keyword in goal_lower:
            return rewrite
    
    # Fall back to goal-type templates
    type_templates = templates.get(goal_type, templates[GoalType.OTHER])
    
    # Pick the first template as it's usually the most general
    return type_templates[0]


def stub_reality_check(step: str, user_input: dict, context) -> "AssessmentResponse":
    """
    Legacy stub for per-field reality check.
    Kept for backward compatibility during transition.
    """
    from app.services.reality_check import RealityCheckResponse
    
    # Get input text based on step
    if step == "goal":
        text = user_input.get("goal", "").strip()
    elif step == "why":
        text = user_input.get("why", "").strip()
    elif step == "boundaries":
        chips = user_input.get("chips", [])
        custom = user_input.get("custom", "")
        if not chips and not custom:
            return RealityCheckResponse(
                status="needs_refinement",
                issues=["Select at least one boundary"],
                rewrite_options=["No burnout"],
                clarifying_questions=[],
                confidence=0.9,
                debug={"model_used": "stub", "fallback_used": True}
            )
        return RealityCheckResponse(
            status="ok", issues=[], rewrite_options=[], 
            clarifying_questions=[], confidence=0.9, 
            debug={"model_used": "stub", "fallback_used": True}
        )
    elif step == "minimum_action":
        text = user_input.get("text", "").strip()
        minutes = user_input.get("minutes", 0)
        if minutes and minutes > 15:
            return RealityCheckResponse(
                status="needs_refinement",
                issues=["Too long for a bad day"],
                rewrite_options=[f"{text} in just 5 minutes"],
                clarifying_questions=[],
                best_guess_refinement=f"{text} for 5 minutes",
                confidence=0.8,
                debug={"model_used": "stub", "fallback_used": True}
            )
    else:
        text = ""
    
    # Simple checks
    word_count = len(text.split())
    text_lower = text.lower()
    
    # Too short
    if word_count < 4:
        return RealityCheckResponse(
            status="needs_refinement",
            issues=["Too brief - add more detail"],
            rewrite_options=["Add what, when, or how often"],
            clarifying_questions=["What specifically will you do?"],
            confidence=0.7,
            debug={"model_used": "stub", "fallback_used": True}
        )
    
    # Multiple goals
    if " and " in text_lower and step in ["goal", "minimum_action"]:
        return RealityCheckResponse(
            status="needs_refinement",
            issues=["Pick just one thing"],
            rewrite_options=["Focus on your top priority"],
            clarifying_questions=["Which one matters most right now?"],
            confidence=0.8,
            debug={"model_used": "stub", "fallback_used": True}
        )
    
    # Vague language
    vague_words = ["better", "more", "improve", "stuff", "things", "try", "maybe"]
    if any(word in text_lower for word in vague_words):
        return RealityCheckResponse(
            status="needs_refinement",
            issues=["Too vague - be specific"],
            rewrite_options=["Add a number or deadline"],
            clarifying_questions=["How will you know you succeeded?"],
            confidence=0.7,
            debug={"model_used": "stub", "fallback_used": True}
        )
    
    return RealityCheckResponse(
        status="ok",
        issues=[],
        rewrite_options=[],
        clarifying_questions=[],
        confidence=0.85,
        debug={"model_used": "stub", "fallback_used": True}
    )
