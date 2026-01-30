# DriftMirror - Quick Start Guide

## Prerequisites
- Python 3.13+ with venv
- Node.js 18+ with npm
- Google Gemini API key (optional for demo - demo works without it)

## Starting the Application

### 1. Start Backend (Terminal 1)
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Backend will be available at: http://localhost:8000

### 2. Start Frontend (Terminal 2)
```bash
cd frontend
npm install
npm run dev
```

Frontend will be available at: http://localhost:3001

### 3. Seed Demo Data
Once both servers are running, click the "See it in Action" button on the landing page or run:
```bash
curl -X POST http://localhost:8000/api/demo/seed
```

This creates a demo goal with 5 check-ins and a mirror report ready to view.

## Environment Variables (Optional)

### Backend (.env in backend/)
```env
GEMINI_API_KEY=your_api_key_here  # Optional - demo works without it
GEMINI_MODEL=gemini-2.0-flash
ENVIRONMENT=development
```

### Frontend (.env.local in frontend/)
```env
BACKEND_URL=http://127.0.0.1:8000  # Already configured by default
```

## Troubleshooting

### Backend won't start
- Ensure venv is activated: `source venv/bin/activate`
- Reinstall dependencies: `pip install -r requirements.txt`
- Check port 8000 is free: `lsof -i :8000`

### Frontend won't start
- Clear cache: `rm -rf .next`
- Reinstall: `rm -rf node_modules && npm install`
- Check port 3001 is free: `lsof -i :3001`

### API not responding
- Verify both servers are running
- Check backend logs for errors
- Try restarting backend: Ctrl+C then `uvicorn app.main:app --reload --port 8000`

## Demo Flow

1. Click "See it in Action" on landing page → Seeds demo data
2. Redirects to dashboard showing "Learn Spanish" goal
3. Click on goal card → See detailed metrics and mirror report
4. Explore timeline showing 5 check-ins with drift patterns
5. Review actionable insights based on detected drift

## Production Build

```bash
# Frontend production build
cd frontend
npm run build
npm start

# Backend production
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
