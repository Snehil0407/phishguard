# PhishGuard - Quick Start Guide

## Current Status

✅ **Phase 1 COMPLETED** - Project is initialized and ready for development!

## What's Working

### Backend (Port 8000)
- FastAPI server with auto-reload
- Health check endpoint
- CORS enabled for frontend communication
- ML dependencies installed (ready for Phase 2)

### Frontend (Port 5173)
- React + Vite dev server
- Tailwind CSS styling
- Beautiful landing page
- Axios for API calls (ready for Phase 4)

## Quick Commands

### Start Backend
```bash
cd backend
.\venv\Scripts\activate
python main.py
```
Access at: http://localhost:8000

### Start Frontend
```bash
cd frontend
npm run dev
```
Access at: http://localhost:5173

### View API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
phishguard/
├── backend/          # FastAPI Python backend
├── frontend/         # React web application  
├── extension/        # Chrome extension (Phase 5)
├── ml/              # ML models & training (Phase 2)
└── docs/            # Documentation
```

## Next Phase

**Phase 2: Data Collection & ML Model Development**
- Collect phishing datasets
- Train ML models
- Create prediction functions

## Need Help?

Check these files:
- `README.md` - Main project overview
- `backend/README.md` - Backend specific info
- `docs/PHASE_1_COMPLETION.md` - Detailed Phase 1 summary

---

**Happy Coding! 🚀**
