# PhishGuard - AI-Powered Phishing Detection Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Project Overview

PhishGuard is a comprehensive phishing detection and user awareness platform that identifies phishing attempts across **emails, SMS messages, and URLs**. Built as a MCA 6th Trimester Major Project, it combines a web application with a browser extension, both powered by an AI-driven backend.

## Features

- 🔍 **Multi-Input Detection**: Analyze emails, SMS, and URLs
- 🤖 **AI-Powered**: Machine learning models with NLP
- 📊 **Explainable Results**: Clear risk scores with explanations
- ⚡ **Real-Time Protection**: Browser extension for instant URL scanning
- 📚 **User Education**: Awareness content and safety tips

## Technology Stack

### Backend
- FastAPI
- Python 3.x
- Scikit-learn
- NLTK
- Pandas & NumPy

### Frontend
- React.js
- Vite
- Tailwind CSS
- Axios

### Extension
- Chrome Extension (Manifest V3)
- JavaScript

### Database & Auth
- Firebase Firestore
- Firebase Authentication

## Project Structure

```
phishguard/
├── backend/          # FastAPI backend
├── frontend/         # React web application
├── extension/        # Browser extension
├── ml/              # ML models and training
├── docs/            # Documentation
└── README.md        # This file
```

## Getting Started

### Prerequisites
- Python 3.8+
- Node.js 20+
- npm or yarn

### Backend Setup

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate

pip install -r requirements.txt
python main.py
```

Backend will run at: http://localhost:8000

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run at: http://localhost:5173

## Development Phases

✅ **Phase 1**: Project Initialization & Environment Setup (COMPLETED)
- [x] Project structure created
- [x] Backend FastAPI setup
- [x] Frontend React setup
- [x] Dependencies installed

⏳ **Phase 2**: Data Collection & ML Model Development (NEXT)
⏳ **Phase 3**: Backend API Development
⏳ **Phase 4**: Web Application Development
⏳ **Phase 5**: Browser Extension Development
⏳ **Phase 6**: Awareness Module & Logging
⏳ **Phase 7**: Testing, Deployment & Documentation

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `POST /analyze/email` - Email analysis (Coming soon)
- `POST /analyze/sms` - SMS analysis (Coming soon)
- `POST /analyze/url` - URL analysis (Coming soon)

## Contributing

This is an academic project. Contributions and suggestions are welcome!

## License

MIT License

## Author

MCA 6th Trimester Student
Christ University

## Acknowledgments

- FastAPI Framework
- React & Vite
- Scikit-learn Team
- Open-source community
