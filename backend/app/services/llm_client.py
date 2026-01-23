import httpx
import json
import os
import re
import logging
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

# Load .env from project root (parent of backend folder)
env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(env_path)

# Configure logging
logger = logging.getLogger(__name__)

# LLM Provider: "ollama", "gemini", or "mock" (default: mock for instant dev experience)
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "mock")

# Ollama settings (for local dev)
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma2:2b")
OLLAMA_TIMEOUT = int(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120"))  # Increased for slow local models
OLLAMA_NUM_CTX = int(os.getenv("OLLAMA_NUM_CTX", "4096"))

# Gemini settings (for production)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

# Maximum characters in prompt
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


async def call_gemini(prompt: str, system: str = "") -> Optional[str]:
    """
    Call Google Gemini API. Returns None if unavailable.
    """
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set")
        return None
    
    safe_prompt = truncate_prompt(prompt, system)
    full_prompt = f"{system}\n\n{safe_prompt}" if system else safe_prompt
    
    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}",
                json={
                    "contents": [{"parts": [{"text": full_prompt}]}],
                    "generationConfig": {
                        "temperature": 0.4,
                        "maxOutputTokens": 2048,
                        "responseMimeType": "application/json"
                    }
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                # Extract text from Gemini response structure
                candidates = data.get("candidates", [])
                if candidates:
                    content = candidates[0].get("content", {})
                    parts = content.get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
            else:
                logger.warning(f"Gemini error {response.status_code}: {response.text[:200]}")
    except Exception as e:
        logger.warning(f"Gemini error: {type(e).__name__}: {e}")
    return None


async def call_ollama(prompt: str, system: str = "", json_mode: bool = True) -> Optional[str]:
    """
    Call LLM API (Ollama, Gemini, or Mock based on LLM_PROVIDER env var).
    Returns None if unavailable (triggers stub fallbacks).
    
    Args:
        prompt: The user prompt
        system: System prompt (optional)
        json_mode: If True, forces JSON output format (default: True)
    """
    # Mock mode: return None to trigger stub fallbacks (instant responses)
    if LLM_PROVIDER == "mock":
        logger.info("Using mock mode - returning None to trigger stubs")
        return None
    
    # Use Gemini if configured
    if LLM_PROVIDER == "gemini":
        logger.info(f"Using Gemini: model={GEMINI_MODEL}")
        return await call_gemini(prompt, system)
    
    # Default: Ollama
    safe_prompt = truncate_prompt(prompt, system)
    
    try:
        async with httpx.AsyncClient(timeout=httpx.Timeout(OLLAMA_TIMEOUT)) as client:
            request_body = {
                "model": OLLAMA_MODEL,
                "prompt": safe_prompt,
                "system": system,
                "stream": False,
                "options": {
                    "temperature": 0.3,  # Lower = faster, more focused
                    "num_predict": 1024, # Enough for complete JSON responses
                    "num_ctx": 4096,     # Reduced context for speed
                    "top_k": 20,         # Limit token choices for speed
                    "top_p": 0.9,
                }
            }
            
            if json_mode:
                request_body["format"] = "json"
            
            logger.info(f"Calling Ollama: model={OLLAMA_MODEL}, json_mode={json_mode}")
            
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json=request_body
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("response", "")
            else:
                logger.warning(f"Ollama error {response.status_code}: {response.text[:200]}")
    except httpx.TimeoutException:
        logger.warning(f"Ollama timeout after {OLLAMA_TIMEOUT}s")
    except Exception as e:
        logger.warning(f"Ollama error: {type(e).__name__}: {e}")
    return None


def extract_json_from_response(text: str) -> Optional[dict]:
    """Extract JSON from LLM response, handling markdown blocks and common LLM mistakes."""
    if not text:
        return None
    
    # Try to find JSON in code blocks first
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
        start = text.find("{")
        end = text.rfind("}") + 1
        if start >= 0 and end > start:
            json_str = text[start:end]
            
            # Fix common LLM JSON mistakes (single quotes instead of double)
            json_str = re.sub(r"':", '":', json_str)
            json_str = re.sub(r":'", ':"', json_str)
            json_str = json_str.replace("'}", '"}')
            json_str = json_str.replace("',", '",')
            json_str = json_str.replace("']", '"]')
            
            return json.loads(json_str)
    except json.JSONDecodeError as e:
        logger.debug(f"JSON parse failed: {e}")
    
    return None
