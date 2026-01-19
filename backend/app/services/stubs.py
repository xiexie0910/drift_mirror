from typing import List, Dict

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
    counterfactual = f"Based on your pattern, you likely could have completed one more session this week if you reduced the session length by 5 minutes. This small adjustment was within reach."
    
    if drift_score > 0.6:
        counterfactual = f"Based on your friction levels, you likely could have maintained momentum if sessions were shorter and more frequent. Even 10 minutes done consistently beats 30 minutes skipped."
    
    return {
        "findings": findings[:3],
        "counterfactual": counterfactual
    }
