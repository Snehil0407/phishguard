# PhishGuard - AI-Powered Phishing Detection & Monitoring Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com/)

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Machine Learning Models](#machine-learning-models)
- [Real-Time Email Monitoring](#real-time-email-monitoring)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [API Documentation](#api-documentation)
- [Security Features](#security-features)
- [Screenshots](#screenshots)
- [Development Status](#development-status)
- [Contributing](#contributing)
- [License](#license)

---

## 🎯 Project Overview

**PhishGuard** is a comprehensive AI-powered phishing detection and monitoring platform developed as an MCA 6th Trimester Major Project at Christ University. The system provides real-time protection against phishing attacks through multi-channel analysis (Email, SMS, and URLs) with continuous monitoring capabilities.

### What Makes PhishGuard Unique?

- **Real-Time Email Monitoring**: Automated IMAP-based continuous inbox monitoring
- **Multi-Channel Detection**: Analyze emails, SMS messages, and URLs
- **AI-Powered Analysis**: Advanced machine learning models with explainable AI
- **User-Centric Design**: Intuitive interface with comprehensive threat explanations
- **Secure Credential Management**: Firebase-based encrypted storage
- **Persistent Monitoring**: Cross-page monitoring that survives navigation

---

## ✨ Key Features

### 🔐 Multi-Channel Phishing Detection

#### 📧 Email Analysis
- **Manual Analysis**: Upload email content, subject, sender information
- **Batch Processing**: Analyze multiple emails at once
- **Detailed Threat Assessment**: Risk scores with red flag identification
- **Explainable Results**: Clear breakdown of why an email is flagged

#### 📱 SMS Analysis
- **Text Message Scanning**: Analyze suspicious SMS content
- **Pattern Recognition**: Detect common SMS phishing tactics
- **Instant Results**: Real-time analysis with risk scores

#### 🔗 URL Analysis
- **Direct URL Scanning**: Check any website link for phishing indicators
- **Link Extraction**: Automatically extract and analyze URLs from emails
- **Comprehensive Features**: 30+ URL features analyzed (domain age, SSL, redirects, etc.)

### 📮 Real-Time Email Monitoring (Core Feature)

PhishGuard's most powerful feature is its **automated email monitoring system** that provides continuous protection:

#### 🔄 Continuous Monitoring
- **IMAP Integration**: Direct connection to Gmail, Outlook, Yahoo, iCloud
- **Automated Scanning**: Checks inbox every 2 minutes for new emails
- **Background Processing**: Runs in the background across all pages
- **Keep-Alive Mechanism**: Auto-restarts monitoring if connection drops

#### 🎯 Smart Analysis
- **Last 10 Emails**: Automatically analyzes recent inbox messages
- **Real-Time Updates**: New phishing detection results appear instantly
- **Persistent State**: Monitoring continues even when navigating to other pages
- **Smart Polling**: Frontend checks every 15 seconds, backend scans every 2 minutes

#### 🔒 Secure Credential Storage
- **Firebase Firestore**: Encrypted app-specific password storage
- **Auto-Fill on Login**: Saved credentials automatically populate
- **Base64 Encryption**: Passwords encrypted before storage
- **User-Specific Access**: Firestore rules enforce data isolation

#### 📊 Visual Dashboard
- **Live Status Indicator**: Pulsing green dot shows active monitoring
- **Email Result Cards**: Each analyzed email shown with risk score
- **Newest First**: Most recent emails appear at the top
- **Smooth Animations**: No flickering on refresh or new results
- **Manual Refresh**: Button to fetch latest results on demand

#### ⚡ Performance Optimizations
- **Retry Logic**: Attempts initial fetch 3 times with progressive delays (2s, 4s, 6s)
- **Stable Keys**: React keys prevent unnecessary re-renders
- **Loading States**: Visual feedback during analysis
- **Error Handling**: Graceful degradation with user-friendly messages

---

## 🛠 Technology Stack

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Python** | 3.8+ | Core programming language |
| **FastAPI** | 0.115.0 | High-performance REST API framework |
| **Scikit-learn** | 1.5.0 | Machine learning models |
| **NLTK** | 3.8.1 | Natural language processing |
| **Pandas** | 2.2.2 | Data manipulation |
| **NumPy** | 1.26.4 | Numerical computations |
| **imaplib** | Built-in | IMAP email fetching |
| **asyncio** | Built-in | Asynchronous email monitoring |
| **Uvicorn** | 0.30.1 | ASGI server |

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2.0 | UI framework |
| **Vite** | 5.4.11 | Build tool and dev server |
| **React Router** | 7.1.1 | Client-side routing |
| **Tailwind CSS** | 3.4.17 | Utility-first CSS framework |
| **Framer Motion** | 11.15.0 | Animation library |
| **Lucide React** | 0.468.0 | Icon library |
| **Firebase** | 11.1.0 | Authentication & database |
| **Axios** | 1.7.9 | HTTP client |
| **jsPDF** | 2.5.2 | PDF report generation |

### Database & Authentication
| Technology | Purpose |
|-----------|---------|
| **Firebase Authentication** | User authentication & session management |
| **Firebase Firestore** | NoSQL database for user data & credentials |
| **Firestore Security Rules** | Row-level security enforcement |

### Development Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

---

## 🏗 Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Dashboard  │  │ URL Analysis │  │ SMS Analysis │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         Email Monitoring (with Global Context)      │    │
│  │  • IMAP Credentials Management                      │    │
│  │  • Real-time Result Display                         │    │
│  │  • Auto-refresh & Manual Refresh                    │    │
│  │  • Cross-page Persistence                           │    │
│  └─────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (Axios)
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  Backend (FastAPI + Python)                 │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              API Endpoints                           │   │
│  │  • /analyze/email     • /analyze/url                │   │
│  │  • /analyze/sms       • /api/email/validate         │   │
│  │  • /api/email/start-monitoring                      │   │
│  │  • /api/email/stop-monitoring                       │   │
│  │  • /api/email/recent-results                        │   │
│  │  • /api/email/monitoring-status                     │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         Email Monitor Service (asyncio)              │   │
│  │  • IMAP Connection Management                        │   │
│  │  • Continuous Monitoring Loop (2 min intervals)      │   │
│  │  • Email Parsing & Analysis                          │   │
│  │  • Result Storage & Callbacks                        │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              ML Predictor Service                    │   │
│  │  • Email Model (Random Forest - 96.61%)             │   │
│  │  • SMS Model (Random Forest - 98.30%)               │   │
│  │  • URL Model (Random Forest - 99.80%)               │   │
│  │  • Feature Extraction Pipeline                       │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  Firebase Services                          │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Authentication  │         │    Firestore     │          │
│  │  • User Login    │         │  • User Profiles │          │
│  │  • Registration  │         │  • Email Creds   │          │
│  │  • Session Mgmt  │         │  • Scan History  │          │
│  └──────────────────┘         └──────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### Email Monitoring Flow

```
┌─────────────┐
│   User      │
│  Validates  │
│ Credentials │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│         Frontend: EmailMonitoring.jsx           │
│  1. Save credentials to Firestore (encrypted)   │
│  2. Update global EmailMonitoringContext        │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│    Backend: /api/email/start-monitoring          │
│  1. Validate IMAP credentials                    │
│  2. Create asyncio monitoring task               │
│  3. Store task in active_monitoring_tasks dict   │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│   EmailMonitorService.start_monitoring()         │
│  LOOP (every 2 minutes):                         │
│   1. Connect to IMAP server                      │
│   2. Fetch last 10 emails                        │
│   3. Parse email headers & body                  │
│   4. Extract links from email                    │
│   5. Send to ML predictor                        │
│   6. Store results with callback                 │
│   7. Sleep for 2 minutes                         │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│      recent_scan_results Dictionary              │
│  Key: "userId:emailAddress"                      │
│  Value: List of analysis results (max 50)       │
│  • Newest results appended to end               │
│  • Frontend fetches via /recent-results         │
└──────┬───────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│  Frontend: Global Context Polling (15s)         │
│  1. Fetch results from /recent-results          │
│  2. Update recentAnalysis state                 │
│  3. Trigger UI re-render                        │
│  4. Display result cards (newest first)         │
└──────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────┐
│         Keep-Alive Check (60s)                   │
│  1. Check /monitoring-status                     │
│  2. If inactive → auto-restart                   │
│  3. Ensure persistent monitoring                │
└──────────────────────────────────────────────────┘
```

---

## 🤖 Machine Learning Models

### Model Training & Evaluation

PhishGuard trains **multiple ML models** (Logistic Regression, Naive Bayes, XGBoost, Gradient Boosting) across all three detection channels and automatically selects the best-performing model. All best models are **XGBoost classifiers**, trained on diverse datasets with comprehensive feature engineering.

#### 📧 Email Detection Model

**Dataset**: 10,188 emails (CEAS_08, Enron, Ling, Nazario, Nigerian Fraud, SpamAssassin)

**Features Extracted**:
- Text-based: TF-IDF vectorization (5000 features)
- Subject line analysis
- Sender domain patterns
- Email structure features
- Keyword frequency (urgent, verify, click, suspended, etc.)
- Special character ratios
- Link count and suspicious link patterns

**Models Trained & Compared**:
- Logistic Regression: 95.93%
- Naive Bayes: 91.95%
- **XGBoost: 97.40% ← Best Selected**

**Best Model Performance (XGBoost)**:
```
Accuracy:  97.40%
Precision: 97.39%
Recall:    97.40%
F1-Score:  97.39%
CV Score:  97.10% (+/- 0.60%)
```

#### 📱 SMS Detection Model

**Dataset**: 5,572 SMS messages (spam and legitimate)

**Features Extracted**:
- TF-IDF text features
- Message length
- Capital letter ratio
- Special character frequency
- Keyword patterns (win, free, prize, urgent)
- Number occurrence patterns
- URL presence

**Models Trained & Compared**:
- Logistic Regression: 97.13%
- Naive Bayes: 97.94%
- **XGBoost: 98.12% ← Best Selected**

**Best Model Performance (XGBoost)**:
```
Accuracy:  98.12%
Precision: 98.10%
Recall:    98.12%
F1-Score:  98.10%
CV Score:  97.98% (+/- 0.54%)
```

#### 🔗 URL Detection Model

**Dataset**: 100,000 URLs (50,000 phishing, 50,000 legitimate)

**Features Extracted** (23 engineered features):
- `url_length`, `is_long_url` — URL length signals
- `has_ip`, `has_typosquatting`, `has_brand_mismatch` — Domain spoofing
- `has_excessive_subdomains`, `subdomain_count` — Subdomain abuse
- `is_https`, `is_url_shortener`, `is_trusted` — Trust indicators
- `suspicious_word_count`, `has_urgent_words` — Keyword patterns
- `has_suspicious_chars`, `has_port` — Structural anomalies
- `dot_count`, `dash_count`, `at_count`, `slash_count` — Character counts
- `question_count`, `equals_count`, `underscore_count`, `percent_count`, `ampersand_count`

**Models Trained & Compared**:
- Logistic Regression: 99.76%
- Gradient Boosting: 99.80%
- **XGBoost: 99.81% ← Best Selected**

**Best Model Performance (XGBoost)**:
```
Accuracy:  99.81%
Precision: 99.81%
Recall:    99.81%
F1-Score:  99.81%
CV Score:  99.79% (+/- 0.01%)
```

### Explainable AI

Each prediction comes with:
- **Risk Score**: 0-100 percentage
- **Severity Level**: Low, Medium, High, Critical
- **Red Flags**: List of concerning indicators found
- **Green Flags**: List of safe indicators found
- **Flag Counts**: Quantified suspicious vs. safe signals
- **Detailed Analysis**: Per-feature breakdown

---

## 📮 Real-Time Email Monitoring

### Setup Process

1. **Navigate to Email Monitoring Page**
2. **Connect Email Account** (Step 1)
   - Select provider (Gmail/Outlook/Yahoo/iCloud)
   - Enter email address
   - Enter app-specific password (NOT regular password)
   - Click "Validate Credentials"

3. **Analyze Recent Emails** (Step 2)
   - System fetches last 10 emails from inbox
   - ML model analyzes each email
   - Results displayed with risk scores
   - Click "Start Monitoring" to enable continuous scanning

4. **Active Monitoring** (Step 3)
   - Green pulsing indicator shows active status
   - New emails analyzed every 2 minutes
   - Results update automatically every 15 seconds
   - Manual refresh button available
   - Stop button to pause monitoring

### How to Generate App-Specific Passwords

#### Gmail (Google)
1. Enable 2-Factor Authentication
2. Go to Google Account → Security
3. Search for "App Passwords"
4. Select "Mail" and device
5. Copy the 16-character password

#### Outlook (Microsoft)
1. Enable 2-Step Verification
2. Go to Security Settings
3. Create app password under "Security info"
4. Copy the password

#### Yahoo
1. Enable two-step verification
2. Go to Account Security
3. Generate app password
4. Use for PhishGuard

### Monitoring Features

| Feature | Description |
|---------|-------------|
| **Auto-Start on Login** | Monitoring resumes if was active before logout |
| **Cross-Page Persistence** | Works even when browsing other pages |
| **Credential Auto-Fill** | Saved passwords load automatically |
| **Smart Retry Logic** | Initial fetch tries 3 times with progressive delays |
| **Smooth Refresh** | No flickering when new results appear |
| **Newest First** | Most recent emails at top of list |
| **Keep-Alive** | Connection check every 60 seconds |
| **Error Recovery** | Auto-restart on connection drops |

### Security Considerations

- **App Passwords Required**: Never uses main account password
- **Encrypted Storage**: Credentials stored with Base64 encryption in Firestore
- **User Isolation**: Firestore rules ensure users only access own data
- **No Password Logging**: Passwords never logged or printed
- **Secure Transmission**: All API calls over HTTPS
- **Session Management**: Firebase handles authentication tokens

---

## 📁 Project Structure

```
phishguard/
├── backend/
│   ├── main.py                      # FastAPI application entry point (542 lines)
│   ├── requirements.txt             # Python dependencies
│   ├── .env.example                 # Environment variables template
│   ├── .gitignore                   # Git ignore rules
│   ├── services/
│   │   ├── email_monitor.py         # Email monitoring service (421 lines)
│   │   └── __init__.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                  # Main app with providers
│   │   ├── main.jsx                 # React entry point
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Navigation bar
│   │   │   ├── Footer.jsx           # Footer component
│   │   │   ├── ResultCard.jsx       # Analysis result display
│   │   │   ├── PrivateRoute.jsx     # Auth route guard
│   │   │   ├── ConfirmModal.jsx     # Confirmation dialogs
│   │   │   └── ScanDetailsModal.jsx # Detailed scan results
│   │   ├── pages/
│   │   │   ├── Home.jsx             # Landing page
│   │   │   ├── Dashboard.jsx        # User dashboard
│   │   │   ├── Login.jsx            # Login page
│   │   │   ├── Signup.jsx           # Registration page
│   │   │   ├── ResetPassword.jsx    # Password reset
│   │   │   ├── Profile.jsx          # User profile
│   │   │   ├── EmailAnalysis.jsx    # Email scanning (manual)
│   │   │   ├── EmailMonitoring.jsx  # Real-time monitoring (871 lines)
│   │   │   ├── SMSAnalysis.jsx      # SMS scanning
│   │   │   └── URLAnalysis.jsx      # URL scanning
│   │   ├── context/
│   │   │   ├── AuthContext.jsx      # Firebase auth context
│   │   │   └── EmailMonitoringContext.jsx  # Global monitoring state (369 lines)
│   │   ├── services/
│   │   │   ├── api.js               # Axios API client
│   │   │   ├── scanService.js       # Scan history management
│   │   │   └── userService.js       # User & credential management
│   │   ├── utils/
│   │   │   └── pdfGenerator.js      # PDF report generation
│   │   └── config/
│   │       └── firebase.js          # Firebase configuration
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── index.html
│   └── README.md
│
├── ml/
│   ├── predictor.py                 # Unified prediction interface
│   ├── datasets/
│   │   ├── email/                   # Email datasets (10K samples)
│   │   ├── sms/                     # SMS datasets (5K samples)
│   │   └── urls/                    # URL datasets (100K samples)
│   ├── models/
│   │   ├── email_model_best.pkl              # Best email model (XGBoost)
│   │   ├── email_model_xgboost.pkl           # XGBoost email model
│   │   ├── email_model_logistic_regression.pkl
│   │   ├── email_model_naive_bayes.pkl
│   │   ├── email_vectorizer.pkl              # Email TF-IDF vectorizer
│   │   ├── email_training_report.txt         # Training metrics
│   │   ├── email_evaluation_results.json
│   │   ├── sms_model_best.pkl                # Best SMS model (XGBoost)
│   │   ├── sms_model_xgboost.pkl
│   │   ├── sms_model_logistic_regression.pkl
│   │   ├── sms_model_naive_bayes.pkl
│   │   ├── sms_vectorizer.pkl                # SMS TF-IDF vectorizer
│   │   ├── sms_training_report.txt
│   │   ├── sms_evaluation_results.json
│   │   ├── url_model_best.pkl                # Best URL model (XGBoost)
│   │   ├── url_model_xgboost.pkl
│   │   ├── url_model_logistic_regression.pkl
│   │   ├── url_model_gradient_boosting.pkl
│   │   ├── url_feature_extractor.pkl         # URL feature pipeline
│   │   ├── url_scaler.pkl                    # URL feature scaler
│   │   ├── url_feature_names.json            # 23 feature names
│   │   ├── url_training_report.txt
│   │   └── url_evaluation_results.json
│   ├── training/
│   │   ├── train_email_model.py     # Email model training
│   │   ├── train_sms_model.py       # SMS model training
│   │   ├── train_url_model.py       # URL model training
│   │   └── train_all_models.py      # Batch training script
│   ├── utils/
│   │   ├── data_loader.py           # Dataset loading utilities
│   │   ├── text_preprocessing.py    # NLP preprocessing
│   │   └── url_features.py          # URL feature extraction
│   └── README.md
│
├── docs/
│   └── MODEL_ARCHITECTURE.md        # ML architecture documentation
│
├── firestore.rules                  # Firestore security rules
├── FIRESTORE_RULES_FIX.md          # Security rules guide
├── .gitignore
└── README.md                        # This file
```

---

## 🚀 Installation & Setup

### Prerequisites

- **Python** 3.8 or higher
- **Node.js** 20.x or higher
- **npm** or **yarn**
- **Firebase Account** (free tier sufficient)
- **Git** (for cloning)

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/phishguard.git
cd phishguard
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python main.py
```

Backend will run at: **http://localhost:8000**

API documentation available at: **http://localhost:8000/docs**

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run at: **http://localhost:5173**

### 4. Environment Variables

Copy the example and fill in your values:

```bash
cd backend
copy .env.example .env
```

Edit `backend/.env`:

```env
PORT=8000
HOST=0.0.0.0
DEBUG=True
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
MODEL_PATH=./models/
```

For the frontend, create `frontend/.env`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_API_URL=http://localhost:8000
```

### 5. Firebase Setup

#### A. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Name it "PhishGuard"
4. Follow setup wizard

#### B. Enable Authentication
1. In Firebase Console, go to **Authentication**
2. Click "Get Started"
3. Enable **Email/Password** sign-in method

#### C. Create Firestore Database
1. Go to **Firestore Database**
2. Click "Create Database"
3. Start in **Production Mode**
4. Choose location (closest to you)

#### D. Configure Security Rules
1. Go to **Firestore Database** → **Rules** tab
2. Replace with this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /emailCredentials/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /scanHistory/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click **Publish**

#### E. Get Firebase Config
1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps"
3. Click **Web** icon (</>) 
4. Register app as "PhishGuard Web"
5. Copy the config object

#### F. Update Frontend Config
Create `frontend/src/config/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 6. Verify Setup

1. **Backend Health Check**:
   ```bash
   curl http://localhost:8000/
   ```
   Should return: `{"message":"Welcome to PhishGuard API",...}`

2. **Frontend Access**:
   Open browser to `http://localhost:5173`
   Should see PhishGuard landing page

3. **Create Test Account**:
   - Click "Sign Up"
   - Register with email/password
   - Verify you can log in

4. **Test Email Monitoring**:
   - Go to "Email Monitoring"
   - Enter email credentials
   - Click "Validate Credentials"
   - Start monitoring

---

## 📡 API Documentation

### Base URL
```
http://localhost:8000
```

### Endpoints

#### General

##### `GET /`
Root endpoint returning API info.

**Response:**
```json
{
  "message": "Welcome to PhishGuard API",
  "version": "1.0.0",
  "status": "running",
  "models_loaded": true
}
```

---

#### Email Analysis

##### `POST /analyze/email`
Analyze a single email for phishing indicators.

**Request Body:**
```json
{
  "subject": "Urgent: Verify Your Account",
  "sender": "noreply@suspicious-bank.com",
  "body": "Click here to verify your account immediately or it will be suspended.",
  "links": ["http://phishing-site.com/verify"]
}
```

**Response:**
```json
{
  "is_phishing": true,
  "risk_score": 87,
  "severity": "high",
  "explanation": {
    "red_flags": [
      "Urgent language detected",
      "Suspicious sender domain",
      "Unverified links present",
      "Threat of account suspension"
    ],
    "green_flags": [],
    "red_flag_count": 4,
    "green_flag_count": 0
  }
}
```

##### `POST /api/email/validate`
Validate IMAP email credentials.

**Request Body:**
```json
{
  "user_id": "uid123",
  "email_address": "user@gmail.com",
  "password": "app-specific-password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Credentials validated successfully"
}
```

##### `POST /api/email/start-monitoring`
Start continuous email monitoring.

**Request Body:**
```json
{
  "user_id": "uid123",
  "email_address": "user@gmail.com",
  "password": "app-password",
  "check_interval": 120
}
```

**Response:**
```json
{
  "success": true,
  "message": "Started monitoring user@gmail.com",
  "data": {
    "user_id": "uid123",
    "email": "user@gmail.com",
    "check_interval": 120,
    "status": "active"
  }
}
```

##### `POST /api/email/stop-monitoring`
Stop monitoring for a user.

**Query Parameters:**
- `user_id`: User ID
- `email_address`: Email being monitored

**Response:**
```json
{
  "success": true,
  "message": "Stopped monitoring user@gmail.com"
}
```

##### `GET /api/email/monitoring-status`
Check monitoring status.

**Query Parameters:**
- `user_id`: User ID

**Response:**
```json
{
  "success": true,
  "data": {
    "is_active": true,
    "email": "user@gmail.com",
    "uptime_seconds": 1234
  }
}
```

##### `GET /api/email/recent-results`
Get recent scan results.

**Query Parameters:**
- `user_id`: User ID
- `email_address`: Email address

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "timestamp": "2026-02-19T10:30:00",
        "email_data": {
          "subject": "Meeting tomorrow",
          "from_email": "colleague@company.com",
          "date": "Wed, 19 Feb 2026 10:25:00"
        },
        "analysis": {
          "is_phishing": false,
          "risk_score": 12,
          "severity": "low"
        }
      }
    ],
    "total": 10
  }
}
```

---

#### SMS Analysis

##### `POST /analyze/sms`
Analyze SMS message content.

**Request Body:**
```json
{
  "text": "CONGRATULATIONS! You've won $1000. Click here to claim your prize now!"
}
```

**Response:**
```json
{
  "is_phishing": true,
  "risk_score": 92,
  "severity": "critical",
  "explanation": {
    "red_flags": [
      "Prize/lottery scam pattern",
      "Excessive urgency",
      "Suspicious link",
      "Too good to be true offer"
    ],
    "red_flag_count": 4,
    "green_flag_count": 0
  }
}
```

---

#### URL Analysis

##### `POST /analyze/url`
Analyze a URL for phishing indicators.

**Request Body:**
```json
{
  "url": "http://paypa1.com/verify-account"
}
```

**Response:**
```json
{
  "is_phishing": true,
  "risk_score": 95,
  "severity": "critical",
  "explanation": {
    "red_flags": [
      "Domain uses character substitution (1 instead of l)",
      "No HTTPS encryption",
      "Suspicious 'verify' keyword in path",
      "Newly registered domain"
    ],
    "green_flags": [],
    "red_flag_count": 4,
    "green_flag_count": 0
  },
  "features": {
    "url_length": 35,
    "domain_length": 11,
    "has_https": false,
    "has_ip": false
  }
}
```

---

## 🔒 Security Features

### Authentication & Authorization
- **Firebase Authentication**: Industry-standard OAuth 2.0
- **Protected Routes**: Client-side route guards
- **Session Management**: Automatic token refresh
- **Password Reset**: Email-based recovery

### Data Security
- **Firestore Security Rules**: Row-level access control
- **Encrypted Credentials**: Base64 encoding for stored passwords
- **HTTPS Only**: Secure communication (in production)
- **No Password Logging**: Credentials never logged

### Email Monitoring Security
- **App Passwords Only**: Never uses main account password
- **IMAP SSL**: Encrypted connection to email servers
- **User Data Isolation**: Each user accesses only their own data
- **Automatic Cleanup**: Sessions terminated on logout

### API Security
- **CORS Configuration**: Restricted origins
- **Input Validation**: Pydantic models
- **Error Handling**: No sensitive info in error messages
- **Rate Limiting**: (Recommended for production)

---

## 📸 Screenshots

### Landing Page
Modern, responsive landing page with feature highlights and call-to-action.

### Dashboard
Centralized hub showing recent scans, monitoring status, and quick actions.

### Email Monitoring
Three-step process: Connect → Validate → Monitor with real-time results.

### Analysis Results
Detailed breakdown with risk scores, severity levels, and explanations.

### User Profile
Account management with Firebase authentication integration.

---

## 📊 Development Status

### ✅ Completed Features

**Phase 1: Foundation**
- [x] Project structure and environment setup
- [x] Backend FastAPI application
- [x] Frontend React application with Vite
- [x] Firebase Authentication integration
- [x] Firestore database setup

**Phase 2: Machine Learning**
- [x] Dataset collection (10K emails, 5K SMS, 100K URLs)
- [x] Feature engineering pipelines
- [x] Model training (Random Forest classifiers)
- [x] Model evaluation and optimization
- [x] Unified prediction interface

**Phase 3: Core Detection**
- [x] Email analysis API
- [x] SMS analysis API
- [x] URL analysis API
- [x] Result explanation generation
- [x] Risk scoring algorithms

**Phase 4: Email Monitoring**
- [x] IMAP integration (Gmail, Outlook, Yahoo, iCloud)
- [x] Continuous monitoring service
- [x] Background task management
- [x] Real-time result updates
- [x] Credential storage with encryption
- [x] Auto-start on login
- [x] Cross-page persistence
- [x] Keep-alive mechanism
- [x] Manual refresh functionality

**Phase 5: User Interface**
- [x] Responsive design with Tailwind CSS
- [x] Smooth animations with Framer Motion
- [x] Dashboard with scan history
- [x] Email monitoring interface
- [x] URL analysis page
- [x] SMS analysis page
- [x] User profile management
- [x] PDF report generation

**Phase 6: Polish & Optimization**
- [x] Loading states and error handling
- [x] Success/error notifications
- [x] Result card animations
- [x] Retry logic for API calls
- [x] Performance optimizations
- [x] Code cleanup and documentation

### 🔄 Future Enhancements

- [ ] Email attachment scanning
- [ ] Bulk email analysis (upload .eml files)
- [ ] Webhook notifications for detected threats
- [ ] Browser extension for real-time URL checking
- [ ] Mobile application (React Native)
- [ ] Advanced reporting and analytics dashboard
- [ ] Multi-language support
- [ ] API rate limiting
- [ ] Dockerization
- [ ] CI/CD pipeline
- [ ] Cloud deployment (AWS/GCP/Azure)

---

## 🤝 Contributing

This project is part of an academic curriculum (MCA 6th Trimester Major Project). While it's primarily educational, contributions and suggestions are welcome!

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- **Python**: Follow PEP 8
- **JavaScript**: ESLint configuration provided
- **Git Commits**: Use conventional commit messages

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 PhishGuard

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 👨‍💻 Author

**MCA Student**  
Christ University, Bangalore  
6th Trimester Major Project  
Academic Year: 2025-2026

---

## 🙏 Acknowledgments

- **FastAPI Team** - Excellent async framework
- **React Team** - Modern UI library
- **Scikit-learn Contributors** - ML toolkit
- **Firebase Team** - Backend services
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Lucide** - Beautiful icons
- **Open Source Community** - Inspiration and tools

---

## 📞 Support

For questions, issues, or suggestions:
- **GitHub Issues**: [Report a bug](https://github.com/yourusername/phishguard/issues)
- **Email**: your.email@example.com

---

## 🎓 Academic Disclaimer

This project is developed for academic purposes as part of the MCA curriculum at Christ University. The phishing detection models are trained on publicly available datasets and should be continuously improved and validated before production deployment.

**Not recommended for critical security infrastructure without further validation and hardening.**

---

<div align="center">

**PhishGuard** - Protecting Users, One Email at a Time 🛡️

Made with ❤️ and ☕ by Christ University MCA Students

[⬆ Back to Top](#-table-of-contents)

</div>
