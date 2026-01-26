"""
LLM Client - Google Gemini Integration
============================================================
Handles all communication with Google's Gemini API.
Includes retry logic for transient errors (503, rate limits).
"""

import asyncio
import json
import logging
import os
import re
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv

# ============================================================
# Configuration
# ============================================================

# Load environment from project root
env_path = Path(__file__).resolve().parents[3] / ".env"
load_dotenv(env_path)

logger = logging.getLogger(__name__)

# Gemini settings from environment
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
MAX_PROMPT_CHARS = int(os.getenv("MAX_PROMPT_CHARS", "6000"))

# Lazy-loaded client instance
_client = None


# ============================================================
# Client Initialization
# ============================================================

def _get_client():
    """Get or create the Gemini client (lazy initialization)."""
    global _client
    
    if _client is None:
        try:
            from google import genai
            _client = genai.Client(api_key=GEMINI_API_KEY)
            logger.info(f"Gemini client initialized for model: {GEMINI_MODEL}")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
            return None
    
    return _client


# ============================================================
# Prompt Utilities
# ============================================================

def truncate_prompt(prompt: str, system: str = "", max_chars: int = MAX_PROMPT_CHARS) -> str:
    """
    Truncate prompt to prevent context overflow.
    Preserves beginning (context) and end (recent data).
    """
    total_length = len(prompt) + len(system)
    
    if total_length <= max_chars:
        return prompt
    
    # Calculate available space for prompt
    available = max_chars - len(system) - 100
    available = max(available, 500)
    
    if len(prompt) <= available:
        return prompt
    
    # Split: 60% from start, 40% from end
    head_size = int(available * 0.6)
    tail_size = available - head_size
    
    return prompt[:head_size] + "\n\n[...truncated...]\n\n" + prompt[-tail_size:]


# ============================================================
# API Calls
# ============================================================

# Retry settings for transient errors (503, rate limits)
MAX_RETRIES = 3
INITIAL_BACKOFF = 2  # seconds


async def call_gemini(prompt: str, system: str = "") -> str:
    """
    Call the Gemini API with the given prompt.
    
    Each call is stateless - no conversation history is stored.
    This ensures we never exceed context limits from accumulated messages.
    
    Includes retry logic with exponential backoff for transient errors
    (503 overloaded, 429 rate limits, network issues).
    
    Args:
        prompt: User prompt/query
        system: System instructions (optional)
    
    Returns:
        Generated text response
    
    Raises:
        RuntimeError: If API key missing, client fails, or max retries exceeded
    """
    if not GEMINI_API_KEY:
        raise RuntimeError("GEMINI_API_KEY not set in environment")
    
    client = _get_client()
    if client is None:
        raise RuntimeError("Failed to initialize Gemini client")
    
    safe_prompt = truncate_prompt(prompt, system)
    full_prompt = f"{system}\n\n{safe_prompt}" if system else safe_prompt
    
    from google.genai import types
    
    config = types.GenerateContentConfig(
        temperature=0.4,
        max_output_tokens=2048,
    )
    
    last_error = None
    
    for attempt in range(MAX_RETRIES):
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=full_prompt,
                config=config,
            )
            
            if response and response.text:
                logger.info(f"Gemini response: {len(response.text)} chars")
                return response.text
            
            raise RuntimeError("Gemini returned empty response")
            
        except Exception as e:
            last_error = e
            error_str = str(e).lower()
            
            # Check if this is a retryable error
            is_retryable = (
                "503" in error_str or
                "overloaded" in error_str or
                "unavailable" in error_str or
                "429" in error_str or
                "rate" in error_str or
                "quota" in error_str or
                "timeout" in error_str
            )
            
            if is_retryable and attempt < MAX_RETRIES - 1:
                backoff = INITIAL_BACKOFF * (2 ** attempt)  # Exponential backoff
                logger.warning(f"Gemini API error (attempt {attempt + 1}/{MAX_RETRIES}): {e}. Retrying in {backoff}s...")
                await asyncio.sleep(backoff)
            else:
                logger.error(f"Gemini API error: {type(e).__name__}: {e}")
                raise
    
    # Should not reach here, but just in case
    raise last_error or RuntimeError("Max retries exceeded")


async def call_llm(prompt: str, system: str = "", json_mode: bool = True) -> str:
    """
    High-level LLM call interface.
    
    Args:
        prompt: The user prompt
        system: System instructions (optional)
        json_mode: Hint for JSON output (for future use)
    
    Returns:
        LLM response text
    """
    logger.info(f"LLM call: model={GEMINI_MODEL}")
    return await call_gemini(prompt, system)


# ============================================================
# Response Parsing
# ============================================================

def extract_json_from_response(text: str) -> Optional[dict]:
    """
    Extract JSON object from LLM response text.
    
    Handles:
    - JSON wrapped in code blocks
    - Raw JSON in response
    - Common LLM formatting mistakes
    
    Args:
        text: Raw LLM response text
    
    Returns:
        Parsed JSON dict, or None if parsing fails
    """
    if not text:
        return None
    
    # Extract from code blocks if present
    json_text = text
    
    if "```json" in text:
        start = text.find("```json") + 7
        end = text.find("```", start)
        if end > start:
            json_text = text[start:end].strip()
    elif "```" in text:
        start = text.find("```") + 3
        end = text.find("```", start)
        if end > start:
            json_text = text[start:end].strip()
    
    # Find JSON object boundaries
    try:
        start = json_text.find("{")
        end = json_text.rfind("}") + 1
        
        if start < 0 or end <= start:
            return None
        
        json_str = json_text[start:end]
        
        # Fix common LLM JSON mistakes
        json_str = re.sub(r"'([^']*)':", r'"\1":', json_str)
        json_str = re.sub(r":\s*'([^']*)'", r': "\1"', json_str)
        json_str = json_str.replace("'}", '"}')
        json_str = json_str.replace("',", '",')
        json_str = json_str.replace("']", '"]')
        json_str = json_str.replace("['", '["')
        
        return json.loads(json_str)
        
    except json.JSONDecodeError as e:
        logger.debug(f"JSON parse failed: {e}")
        return None
