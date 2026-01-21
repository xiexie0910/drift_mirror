import httpx
import json
import os
import logging
from typing import Optional
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma2:2b")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "30"))
# Context window size - Gemma2 supports up to 8K
OLLAMA_NUM_CTX = int(os.getenv("OLLAMA_NUM_CTX", "8192"))
# Maximum characters in prompt to prevent context overflow
MAX_PROMPT_CHARS = int(os.getenv("MAX_PROMPT_CHARS", "6000"))


def truncate_prompt(prompt: str, system: str = "", max_chars: int = MAX_PROMPT_CHARS) -> str:
    """
    Truncate prompt to prevent context length exceeded errors.
    Keeps the most important parts (beginning and end).
    """
    total_len = len(prompt) + len(system)
    if total_len <= max_chars:
        return prompt
    
    # Reserve space for system prompt
    available = max_chars - len(system) - 100  # 100 char buffer
    if available < 500:
        available = 500  # Minimum prompt size
    
    if len(prompt) <= available:
        return prompt
    
    # Keep first 60% and last 40% of available space
    first_part = int(available * 0.6)
    last_part = available - first_part
    
    truncated = prompt[:first_part] + "\n\n[...truncated for context limit...]\n\n" + prompt[-last_part:]
    return truncated


async def call_ollama(prompt: str, system: str = "") -> Optional[str]:
    """
    Call Ollama API. Returns None if unavailable.
    Automatically truncates prompts to prevent context overflow.
    """
    # Truncate prompt if too long
    safe_prompt = truncate_prompt(prompt, system)
    
    try:
        async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": safe_prompt,
                    "system": system,
                    "stream": False,
                    "options": {
                        "temperature": 0.3,
                        "num_predict": 500,
                        "num_ctx": OLLAMA_NUM_CTX,  # Increase context window
                    }
                }
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("response", "")
            else:
                # Log error for debugging
                error_text = response.text[:200] if response.text else "No error text"
                logger.warning(f"Ollama error {response.status_code}: {error_text}")
    except httpx.TimeoutException:
        logger.debug("Ollama timeout - using fallback")
    except Exception as e:
        # Silent fail - caller will use fallback
        logger.debug(f"Ollama error: {type(e).__name__}")
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
