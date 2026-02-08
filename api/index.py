"""
Vercel Serverless Function — FastAPI Backend
============================================================
Exports the FastAPI ASGI app for Vercel's Python runtime.
All /api/* requests are routed here via vercel.json.
"""
import sys
import os

# Add backend to Python path so 'app' package resolves
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.main import app
