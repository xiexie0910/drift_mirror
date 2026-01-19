# DriftMirror

A minimal goal-tracking app with LLM-powered reflection and autonomous plan adaptation.

**Philosophy:** "Start before you think about the value. Value comes after you start. Don't wait."

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### Requirements
- Python 3.10+
- Node.js 18+
- Ollama (optional, has fallback)

## Demo
Click "Load Demo Data" on the dashboard to seed sample data and trigger a mirror report instantly.
