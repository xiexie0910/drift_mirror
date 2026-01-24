"""
LLM Client - Google Gemini Integration
============================================================

Uses Google GenAI SDK with Gemini 3 Flash Preview model.
Falls back to stub responses on API errors.
"""
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

# Gemini settings
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")

# Maximum characters in prompt
MAX_PROMPT_CHARS = int(os.getenv("MAX_PROMPT_CHARS", "6000"))

# Initialize Gemini client (lazy load to avoid import errors if not using gemini)
_gemini_client = None


def _get_gemini_client():
    """Lazy initialize Gemini client."""
    global _gemini_client
    if _gemini_client is None:
        try:
            from google import genai
            _gemini_client = genai.Client(api_key=GEMINI_API_KEY)
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            return None
    return _gemini_client


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
    Call Google Gemini API using the GenAI SDK.
    Uses gemini-3-flash-preview with medium thinking level.
    Returns None on error (triggers stub fallbacks).
    """
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not set")
        return None
    
    client = _get_gemini_client()
    if client is None:
        return None
    
    safe_prompt = truncate_prompt(prompt, system)
    full_prompt = f"{system}\n\n{safe_prompt}" if system else safe_prompt
    
    try:
        from google.genai import types
        
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=full_prompt,
            config=types.GenerateContentConfig(
                temperature=0.4,
                max_output_tokens=2048,
                thinking_config=types.ThinkingConfig(thinking_level="medium")
            ),
        )
        
        if response and response.text:
            logger.info(f"Gemini response received: {len(response.text)} chars")
            return response.text
        else:
            logger.warning("Gemini returned empty response")
            return None
            
    except Exception as e:
        logger.warning(f"Gemini error: {type(e).__name__}: {e}")
        return None


async def call_llm(prompt: str, system: str = "", json_mode: bool = True) -> Optional[str]:
    """
    Call Gemini LLM. Returns response text or None on error (triggers stub fallbacks).
    
    Args:
        prompt: The user prompt
        system: System prompt (optional)
        json_mode: If True, requests JSON output format (default: True)
    
    Returns:
        LLM response text or None (triggers stub fallbacks on error)
    """
    logger.info(f"Calling Gemini: model={GEMINI_MODEL}")
    return await call_gemini(prompt, system)


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
