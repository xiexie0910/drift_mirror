"""
Resource Discovery Service - Agent B
============================================================
Produces roadmap steps, resources, and candidate minimum actions
when user doesn't know how to start (unknown_actions flag set).
"""
from typing import Optional, List
from pydantic import BaseModel, Field
from enum import Enum

from app.services.llm_client import call_ollama, extract_json_from_response
from app.services.goal_assessment import GoalType, QuestionnairePayload

# ============================================================
# Output Schemas
# ============================================================

class ResourceType(str, Enum):
    ARTICLE = "article"
    VIDEO = "video"
    COURSE = "course"
    APP = "app"
    BOOK = "book"
    TOOL = "tool"

class Resource(BaseModel):
    """A helpful resource for achieving the goal."""
    title: str = Field(..., max_length=100)
    type: ResourceType = Field(default=ResourceType.ARTICLE)
    description: str = Field(..., max_length=200)
    url_hint: Optional[str] = Field(default=None, description="Suggested search term or known URL")

class RoadmapStep(BaseModel):
    """A step in the learning/progress roadmap."""
    order: int = Field(..., ge=1, le=10)
    title: str = Field(..., max_length=100)
    description: str = Field(..., max_length=300)
    estimated_duration: str = Field(default="1-2 weeks", description="e.g., '1 week', '2-3 days'")

class CandidateAction(BaseModel):
    """A potential minimum action the user could adopt."""
    text: str = Field(..., max_length=150)
    minutes: int = Field(default=10, ge=2, le=30)
    difficulty: str = Field(default="easy", pattern="^(easy|medium|hard)$")
    rationale: str = Field(default="", max_length=150)

class ResourceDiscoveryRequest(BaseModel):
    """Request to discover resources for a goal."""
    payload: QuestionnairePayload
    goal_type: GoalType = Field(default=GoalType.OTHER)

class ResourceDiscoveryResponse(BaseModel):
    """Full resource discovery response from Agent B."""
    
    # Roadmap (3-6 steps)
    roadmap: List[RoadmapStep] = Field(default_factory=list, max_length=6)
    
    # Resources (max 5)
    resources: List[Resource] = Field(default_factory=list, max_length=5)
    
    # Candidate minimum actions (6-10)
    candidate_actions: List[CandidateAction] = Field(default_factory=list, max_length=10)
    
    # Recommended first action (LLM's best pick)
    recommended_action: Optional[CandidateAction] = None
    
    # Confidence & debug
    confidence: float = Field(default=0.7, ge=0.0, le=1.0)
    debug: dict = Field(default_factory=dict)

# ============================================================
# System Prompt
# ============================================================

SYSTEM_PROMPT = """You are a helpful guide who helps people get started with their goals.

Given a user's SPECIFIC goal, generate 6-8 CANDIDATE MINIMUM ACTIONS that are tailored to EXACTLY what they want to achieve.

CRITICAL: Actions must be SPECIFIC to the user's goal, NOT generic advice.

If the user says "learn tennis", suggest tennis-specific actions like:
- "Watch a 5-minute video on basic grip"
- "Practice forehand swings in the living room"
- "Look up tennis courts near you"

If the user says "learn Python", suggest Python-specific actions like:
- "Open python.org and read the intro"
- "Write a 'hello world' program"
- "Install Python on your computer"

DO NOT give generic advice like "spend 5 minutes on your goal" - that's useless.

CANDIDATE MINIMUM ACTIONS should be:
- SPECIFIC to the user's exact goal
- Doable in 2-15 minutes (preferably 5-10)
- Single physical actions (not multiple steps)
- Possible even when tired, stressed, or unmotivated
- Observable (you could verify if it happened)

RATIONALE should briefly explain why this is a good starting point.

RESPONSE FORMAT (valid JSON only):
{
  "candidate_actions": [
    {"text": "Specific action for this goal", "minutes": 5, "difficulty": "easy|medium|hard", "rationale": "Why this is a good first step"}
  ],
  "recommended_action": {"text": "Best first step for this specific goal", "minutes": 5, "difficulty": "easy", "rationale": "Why start here"},
  "confidence": 0.8
}

Remember: Be SPECIFIC to the user's goal. Generic advice is not helpful."""

# ============================================================
# Prompt Builder
# ============================================================

def build_discovery_prompt(payload: QuestionnairePayload, goal_type: GoalType) -> str:
    """Build the prompt for resource discovery."""
    
    # Format boundaries
    boundaries_str = ""
    if payload.boundaries.chips:
        boundaries_str = f"Selected constraints: {', '.join(payload.boundaries.chips)}"
    if payload.boundaries.custom:
        boundaries_str += f"\nCustom constraint: {payload.boundaries.custom}"
    if not boundaries_str:
        boundaries_str = "(no constraints specified)"
    
    return f"""USER'S GOAL CONTEXT:

GOAL: "{payload.goal}"
CATEGORY: {goal_type.value}

WHY THIS MATTERS: "{payload.why}"

CONSTRAINTS/BOUNDARIES:
{boundaries_str}

Generate minimum action candidates for this goal with rationales explaining how people typically start.
Focus on making the first step as easy and relatable as possible given their constraints."""

# ============================================================
# Goal-Specific Action Mappings for Stub
# ============================================================

def _get_goal_specific_actions(goal_lower: str) -> List[CandidateAction]:
    """Return actions tailored to specific goal keywords."""
    
    # Tennis
    if "tennis" in goal_lower:
        return [
            CandidateAction(text="Watch a 5-min video on basic tennis grip", minutes=5, difficulty="easy", rationale="Understanding grip is the foundation"),
            CandidateAction(text="Practice forehand swings without a ball", minutes=5, difficulty="easy", rationale="Shadow practice builds muscle memory"),
            CandidateAction(text="Find tennis courts near you on Google Maps", minutes=3, difficulty="easy", rationale="Knowing where to play removes friction"),
            CandidateAction(text="Hit balls against a wall for 10 minutes", minutes=10, difficulty="medium", rationale="Wall practice is how many beginners start"),
            CandidateAction(text="Look up local tennis clubs or meetups", minutes=5, difficulty="easy", rationale="Finding playing partners keeps you motivated"),
            CandidateAction(text="Watch one professional tennis match point", minutes=5, difficulty="easy", rationale="Watching pros helps visualize good form"),
        ]
    
    # Basketball
    if "basketball" in goal_lower:
        return [
            CandidateAction(text="Practice dribbling in place for 5 minutes", minutes=5, difficulty="easy", rationale="Ball control is the first skill to develop"),
            CandidateAction(text="Find basketball courts near you", minutes=3, difficulty="easy", rationale="Knowing where to play makes it easy to start"),
            CandidateAction(text="Watch a 5-min video on shooting form", minutes=5, difficulty="easy", rationale="Good form early prevents bad habits"),
            CandidateAction(text="Shoot 10 free throws at a local court", minutes=10, difficulty="easy", rationale="Free throws are a simple way to get started"),
            CandidateAction(text="Look up pickup game schedules in your area", minutes=5, difficulty="easy", rationale="Playing with others is more fun and motivating"),
            CandidateAction(text="Practice layups for 10 minutes", minutes=10, difficulty="medium", rationale="Layups are the most common shot in basketball"),
        ]
    
    # Python / Coding
    if "python" in goal_lower:
        return [
            CandidateAction(text="Go to python.org and read the intro", minutes=5, difficulty="easy", rationale="The official site has beginner-friendly resources"),
            CandidateAction(text="Install Python on your computer", minutes=10, difficulty="easy", rationale="Having it installed removes the first barrier"),
            CandidateAction(text="Write a 'Hello World' program", minutes=5, difficulty="easy", rationale="The classic first program for any language"),
            CandidateAction(text="Complete one Codecademy Python lesson", minutes=10, difficulty="easy", rationale="Interactive lessons make learning feel like a game"),
            CandidateAction(text="Watch a 10-min Python beginner video", minutes=10, difficulty="easy", rationale="Videos help you see how code is written"),
            CandidateAction(text="Write a program that adds two numbers", minutes=10, difficulty="medium", rationale="A simple task that teaches variables and operators"),
        ]
    
    # Full stack / Web dev
    if "full stack" in goal_lower or "fullstack" in goal_lower or "web dev" in goal_lower:
        return [
            CandidateAction(text="Create a simple HTML file and open it in browser", minutes=5, difficulty="easy", rationale="HTML is the foundation - start here"),
            CandidateAction(text="Watch a 10-min 'what is full stack' overview video", minutes=10, difficulty="easy", rationale="Understanding the landscape helps you plan"),
            CandidateAction(text="Set up VS Code on your computer", minutes=10, difficulty="easy", rationale="Having a good editor makes coding easier"),
            CandidateAction(text="Complete one freeCodeCamp lesson", minutes=10, difficulty="easy", rationale="Free, structured curriculum used by millions"),
            CandidateAction(text="Build a simple webpage with your name on it", minutes=15, difficulty="medium", rationale="Making something real motivates continued learning"),
            CandidateAction(text="Research frontend vs backend to decide where to start", minutes=10, difficulty="easy", rationale="Choosing a starting point gives you focus"),
        ]
    
    # Guitar
    if "guitar" in goal_lower:
        return [
            CandidateAction(text="Watch a 5-min video on how to hold a guitar", minutes=5, difficulty="easy", rationale="Proper posture prevents bad habits"),
            CandidateAction(text="Learn and practice one chord (like G or C)", minutes=10, difficulty="easy", rationale="One chord at a time builds foundation"),
            CandidateAction(text="Download a guitar tuning app", minutes=3, difficulty="easy", rationale="Playing in tune makes practice sound better"),
            CandidateAction(text="Strum the open strings for 5 minutes", minutes=5, difficulty="easy", rationale="Getting used to the feel of strumming"),
            CandidateAction(text="Look up easy songs with 2-3 chords", minutes=5, difficulty="easy", rationale="Playing songs keeps practice fun"),
            CandidateAction(text="Practice switching between two chords", minutes=10, difficulty="medium", rationale="Chord transitions are key to playing songs"),
        ]
    
    # Running
    if "run" in goal_lower or "running" in goal_lower:
        return [
            CandidateAction(text="Put on running shoes and walk out the door", minutes=2, difficulty="easy", rationale="Getting ready is often the hardest part"),
            CandidateAction(text="Walk/jog for 10 minutes around your block", minutes=10, difficulty="easy", rationale="Start with a mix of walking and light jogging"),
            CandidateAction(text="Download a Couch to 5K app", minutes=3, difficulty="easy", rationale="Structured programs take the guesswork out"),
            CandidateAction(text="Run for 1 minute, walk for 2 minutes, repeat 3x", minutes=10, difficulty="easy", rationale="Interval training builds endurance gradually"),
            CandidateAction(text="Find a nice running route near your home", minutes=5, difficulty="easy", rationale="A pleasant route makes running more enjoyable"),
            CandidateAction(text="Run at a pace where you can still talk", minutes=10, difficulty="medium", rationale="Conversational pace prevents burnout"),
        ]
    
    # Gym
    if "gym" in goal_lower:
        return [
            CandidateAction(text="Look up gyms near you and their hours", minutes=5, difficulty="easy", rationale="Knowing options removes decision fatigue"),
            CandidateAction(text="Pack a gym bag with essentials", minutes=5, difficulty="easy", rationale="Being prepared makes it easy to go"),
            CandidateAction(text="Watch a 5-min video on gym etiquette", minutes=5, difficulty="easy", rationale="Knowing the norms reduces anxiety"),
            CandidateAction(text="Go to the gym and just walk on treadmill for 10 min", minutes=15, difficulty="easy", rationale="Just showing up is the first win"),
            CandidateAction(text="Try one machine and learn how it works", minutes=10, difficulty="easy", rationale="Learning one thing at a time is less overwhelming"),
            CandidateAction(text="Ask the front desk about beginner orientations", minutes=5, difficulty="easy", rationale="Many gyms offer free intro sessions"),
        ]
    
    # Reading
    if "read" in goal_lower or "book" in goal_lower:
        return [
            CandidateAction(text="Read one page of your book", minutes=3, difficulty="easy", rationale="One page is so small you can't say no"),
            CandidateAction(text="Put a book on your nightstand or bag", minutes=2, difficulty="easy", rationale="Visibility creates reminders"),
            CandidateAction(text="Read for 5 minutes before bed", minutes=5, difficulty="easy", rationale="Attaching to an existing routine helps"),
            CandidateAction(text="Pick the next book you want to read", minutes=5, difficulty="easy", rationale="Having the next book ready maintains momentum"),
            CandidateAction(text="Read the first chapter of a book", minutes=15, difficulty="medium", rationale="First chapters hook you into continuing"),
            CandidateAction(text="Set up a Goodreads account to track books", minutes=5, difficulty="easy", rationale="Tracking creates accountability"),
        ]
    
    # Meditation
    if "meditat" in goal_lower or "mindful" in goal_lower:
        return [
            CandidateAction(text="Sit quietly and take 5 deep breaths", minutes=2, difficulty="easy", rationale="Deep breathing is meditation's foundation"),
            CandidateAction(text="Download a meditation app like Headspace or Calm", minutes=3, difficulty="easy", rationale="Guided meditations are easier for beginners"),
            CandidateAction(text="Do a 3-minute guided meditation", minutes=5, difficulty="easy", rationale="Short sessions build the habit first"),
            CandidateAction(text="Meditate right after waking up for 5 minutes", minutes=5, difficulty="easy", rationale="Morning meditation sets a calm tone for the day"),
            CandidateAction(text="Focus on your breath for 2 minutes", minutes=2, difficulty="easy", rationale="Breath focus is the simplest technique"),
            CandidateAction(text="Try a body scan meditation", minutes=10, difficulty="medium", rationale="Body awareness deepens relaxation"),
        ]
    
    return []  # No specific match found

# ============================================================
# Stub Fallback
# ============================================================

def stub_resource_discovery(payload: QuestionnairePayload, goal_type: GoalType) -> ResourceDiscoveryResponse:
    """Deterministic fallback when LLM is unavailable."""
    
    goal_lower = payload.goal.lower()
    actions = []
    
    # Try to match specific activities first
    specific_actions = _get_goal_specific_actions(goal_lower)
    if specific_actions:
        actions = specific_actions
    elif goal_type == GoalType.FITNESS:
        actions = [
            CandidateAction(text="Put on workout clothes", minutes=2, difficulty="easy", rationale="Most people find that getting dressed is the hardest part - once you're ready, momentum takes over"),
            CandidateAction(text="Do 5 jumping jacks", minutes=2, difficulty="easy", rationale="Many start with just a few movements to prove to themselves they can do something"),
            CandidateAction(text="Walk around the block once", minutes=10, difficulty="easy", rationale="Walking is how most people ease back into fitness - it's low pressure and gets you outside"),
            CandidateAction(text="Stretch for 5 minutes", minutes=5, difficulty="easy", rationale="Stretching is a gentle entry point that many use before building up to more intense exercise"),
            CandidateAction(text="Watch a 5-min beginner workout video", minutes=5, difficulty="easy", rationale="Watching first helps you visualize what to do - many people start here for confidence"),
            CandidateAction(text="Do 10 squats", minutes=3, difficulty="medium", rationale="A quick bodyweight exercise that people often use to 'just get something done'"),
        ]
        
    elif goal_type == GoalType.LEARNING:
        actions = [
            CandidateAction(text="Watch one 5-minute tutorial video", minutes=5, difficulty="easy", rationale="Most people start by watching others first - it builds familiarity and confidence"),
            CandidateAction(text="Read one beginner article", minutes=10, difficulty="easy", rationale="Reading overviews is a common entry point to understand what you're getting into"),
            CandidateAction(text="Complete one lesson on an app", minutes=10, difficulty="easy", rationale="Apps like Duolingo or Codecademy are popular because they break things into tiny lessons"),
            CandidateAction(text="Write down 3 things you want to learn", minutes=5, difficulty="easy", rationale="Many learners start by clarifying what specifically interests them about the topic"),
            CandidateAction(text="Try one hands-on exercise", minutes=10, difficulty="medium", rationale="Active practice is how many people discover what sticks"),
            CandidateAction(text="Teach someone one thing you know", minutes=10, difficulty="medium", rationale="Teaching forces you to understand deeply - many experts swear by this method"),
        ]
        
    elif goal_type == GoalType.CREATIVE_OUTPUT:
        actions = [
            CandidateAction(text="Open your creative tool and stare at it for 2 minutes", minutes=2, difficulty="easy", rationale="Just opening the app/tool is how many overcome the 'blank page' fear"),
            CandidateAction(text="Create something ugly on purpose", minutes=5, difficulty="easy", rationale="Professional artists often make 'ugly sketches' first to bypass perfectionism"),
            CandidateAction(text="Write/draw for 5 minutes without stopping", minutes=5, difficulty="easy", rationale="Timed freewriting/sketching is a classic technique to enter flow state"),
            CandidateAction(text="Copy something you admire", minutes=10, difficulty="medium", rationale="Learning by copying is how most masters started - it's a time-tested approach"),
            CandidateAction(text="Work on your project for 10 minutes", minutes=10, difficulty="medium", rationale="Committing to just 10 minutes often leads to longer sessions once you're rolling"),
            CandidateAction(text="Share one piece with a trusted friend", minutes=5, difficulty="medium", rationale="Getting feedback from one person builds confidence for sharing more broadly"),
        ]
        
    else:
        # Generic fallback
        actions = [
            CandidateAction(text="Spend 5 minutes on your goal", minutes=5, difficulty="easy", rationale="Many people start with tiny time commitments to build consistency first"),
            CandidateAction(text="Write down your very next action", minutes=3, difficulty="easy", rationale="Getting specific about 'next step' is a proven productivity technique"),
            CandidateAction(text="Set a reminder for tomorrow", minutes=2, difficulty="easy", rationale="Scheduling a time makes you 2-3x more likely to follow through"),
            CandidateAction(text="Tell someone about your goal", minutes=5, difficulty="easy", rationale="Social accountability is one of the strongest predictors of success"),
            CandidateAction(text="Review what you did yesterday", minutes=5, difficulty="easy", rationale="Daily reflection helps identify what's working and builds momentum"),
            CandidateAction(text="Work on your goal for 10 minutes", minutes=10, difficulty="medium", rationale="Starting with just 10 minutes is sustainable even on busy or low-energy days"),
        ]
    
    # Pick recommended action (easiest one)
    recommended = actions[0] if actions else None
    
    return ResourceDiscoveryResponse(
        roadmap=[],  # No longer sending roadmap
        resources=[],  # No longer sending resources
        candidate_actions=actions[:10],
        recommended_action=recommended,
        confidence=0.6,
        debug={"model_used": "stub", "fallback_used": True}
    )

# ============================================================
# Main Discovery Function
# ============================================================

async def discover_resources(
    payload: QuestionnairePayload,
    goal_type: GoalType = GoalType.OTHER,
    retry: bool = True
) -> ResourceDiscoveryResponse:
    """
    Run resource discovery with LLM.
    Returns candidate minimum actions tailored to the user's goal.
    """
    prompt = build_discovery_prompt(payload, goal_type)
    
    # Try LLM call
    for attempt in range(2 if retry else 1):
        response_text = await call_ollama(prompt, SYSTEM_PROMPT)
        
        if response_text:
            parsed = extract_json_from_response(response_text)
            if parsed:
                try:
                    # Parse candidate actions
                    actions = []
                    for act in parsed.get("candidate_actions", [])[:10]:
                        if isinstance(act, dict):
                            difficulty = str(act.get("difficulty", "easy")).lower()
                            if difficulty not in ["easy", "medium", "hard"]:
                                difficulty = "easy"
                            actions.append(CandidateAction(
                                text=str(act.get("text", "Do something"))[:150],
                                minutes=min(30, max(2, int(act.get("minutes", 10)))),
                                difficulty=difficulty,
                                rationale=str(act.get("rationale", ""))[:150]
                            ))
                    
                    # Parse recommended action
                    recommended = None
                    rec_data = parsed.get("recommended_action")
                    if isinstance(rec_data, dict):
                        difficulty = str(rec_data.get("difficulty", "easy")).lower()
                        if difficulty not in ["easy", "medium", "hard"]:
                            difficulty = "easy"
                        recommended = CandidateAction(
                            text=str(rec_data.get("text", "Start small"))[:150],
                            minutes=min(30, max(2, int(rec_data.get("minutes", 5)))),
                            difficulty=difficulty,
                            rationale=str(rec_data.get("rationale", ""))[:150]
                        )
                    elif actions:
                        recommended = actions[0]
                    
                    return ResourceDiscoveryResponse(
                        roadmap=[],
                        resources=[],
                        candidate_actions=actions,
                        recommended_action=recommended,
                        confidence=min(1.0, max(0.0, float(parsed.get("confidence", 0.7)))),
                        debug={"model_used": "ollama", "fallback_used": False}
                    )
                    
                except Exception:
                    continue
    
    # Fallback to stub
    return stub_resource_discovery(payload, goal_type)

# ============================================================
# Exports
# ============================================================

__all__ = [
    "ResourceDiscoveryRequest",
    "ResourceDiscoveryResponse",
    "Resource",
    "ResourceType",
    "RoadmapStep",
    "CandidateAction",
    "discover_resources",
]
