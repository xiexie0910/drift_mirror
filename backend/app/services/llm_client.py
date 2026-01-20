import httpx
import json
import os
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "deepseek-r1:1.5b")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "20"))

async def call_ollama(prompt: str, system: str = "") -> Optional[str]:
    """
    Call Ollama API. Returns None if unavailable.
    """
    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "system": system,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,
                        "num_predict": 500
                    }
                }
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("response", "")
    except Exception:
        # Silent fail - caller will use fallback
        pass
    return None

def extract_json_from_response(text: str) -> Optional[dict]:
    """Extract JSON from LLM response, handling markdown blocks."""
    if not text:
        return None
    
    # Try to find JSON in code blocks
    if "```json" in text:
        start = text.find("```json") + 7
        end = text.find("```", start)
        if end > start:
            text = text[start:end].strip()
    elif "```" in text:
        start = text.find("```") + 3
        end = text.find("```", start)
        if end > start:
            text = text[start:end].strip()
    
    # Try to find JSON object
    try:
        # Find first { and last }
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            return json.loads(text[start:end])
    except json.JSONDecodeError:
        pass
    
    return None
