# DriftMirror

DriftMirror is a lightweight goal-tracking app that helps you turn intentions into a repeatable habit loop: set a goal, define a “minimum action,” check in regularly (including how hard it felt), and get a clear, data-backed reflection when patterns start to drift.

It pairs a simple check-in workflow with “mirror reports” that summarize what’s happening in your own words (blockers, friction, consistency) and surfaces actionable suggestions you can accept, customize, or dismiss. Plan adjustments (frequency/minutes/time window) and minimum-action edits persist to the database so your goal stays aligned with real life.

Built as a small, hackable full‑stack project:
- **Backend:** FastAPI + SQLAlchemy + SQLite
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind
- **LLM:** Google Gemini for reflection/summary generation (kept off the critical path for saving check-ins)

**Philosophy:** "Start before you think about the value. Value comes after you start. Don't wait."

## Prerequisites

- Python 3.10+
- Node.js 18+
- A Google Gemini API key (get one at https://aistudio.google.com/apikey)

## Quick Start

### 1. Clone and Setup Environment

```bash
git clone <your-repo-url>
cd drift_mirror

# Copy environment file and add your API key
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### 2. Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The backend will start at http://localhost:8000
- API docs available at http://localhost:8000/docs

### 3. Frontend Setup (new terminal)

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at http://localhost:3000

### 4. Open the App

Visit http://localhost:3000 in your browser.

## Project Structure

```
drift_mirror/
├── .env.example          # Environment template
├── backend/
│   ├── requirements.txt  # Python dependencies
│   ├── app/
│   │   ├── main.py       # FastAPI app entry
│   │   ├── models.py     # SQLAlchemy models
│   │   ├── routes/       # API endpoints
│   │   └── services/     # LLM & business logic
│   └── driftmirror.db    # SQLite database (created on first run)
├── frontend/
│   ├── package.json      # Node dependencies
│   ├── app/              # Next.js pages
│   ├── components/       # React components
│   └── lib/              # API client & utilities
└── README.md
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Your Google Gemini API key | (required) |
| `GEMINI_MODEL` | Gemini model to use | `gemini-3-flash-preview` |
| `ENVIRONMENT` | `development` or `production` | `development` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |

## Features

- 📝 Goal onboarding with LLM-powered clarity checks
- ✅ Daily check-ins with friction tracking
- 🔍 Pattern detection and drift analysis
- 💡 Personalized insights that quote your own words
- 📊 Progress summaries with habit formation tracking
