# PhishGuard Backend - Quick Start Guide

## 🚀 Starting the Backend

### Step 1: Navigate to Backend Directory
```bash
cd "d:\Christ University\PG\6th trimester\phishguard\backend"
```

### Step 2: Activate Virtual Environment
```bash
.\venv\Scripts\Activate.ps1
```

### Step 3: Start the Server
```bash
python main.py
```

You should see:
```
✓ Email model loaded
✓ SMS model loaded
✓ URL model loaded
✅ All models loaded successfully!
INFO: Uvicorn running on http://0.0.0.0:8000
```

## 🧪 Testing the API

### Option 1: Use the Test Script (Different Terminal)
```bash
cd "d:\Christ University\PG\6th trimester\phishguard"
.\backend\venv\Scripts\Activate.ps1
python quick_test.py
```

### Option 2: Use Browser
Open: http://localhost:8000/docs

### Option 3: Use PowerShell
```powershell
# Test health endpoint
Invoke-RestMethod -Uri http://localhost:8000/health | ConvertTo-Json

# Test email analysis
$body = @{
    content = "URGENT: Verify your account now!"
    subject = "Account Suspended"
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:8000/analyze/email -Method Post -Body $body -ContentType "application/json"
```

## 📊 Expected Test Results

✅ **Email Analysis (Phishing):** ~97% confidence
✅ **SMS Analysis:** ~88% confidence  
✅ **URL Analysis (Phishing):** ~100% confidence

## 🔧 Common Issues

**Port 8000 already in use:**
```bash
# Find and kill the process
Get-Process -Name python | Stop-Process -Force
```

**Models not loading:**
- Ensure you trained the models (Phase 2)
- Check ml/models/ directory has .pkl files

**Import errors:**
- Make sure venv is activated
- Reinstall: `pip install -r requirements.txt`

## 📝 API Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/` | GET | API information |
| `/health` | GET | System health check |
| `/analyze/email` | POST | Analyze email content |
| `/analyze/sms` | POST | Analyze SMS message |
| `/analyze/url` | POST | Analyze URL |

## 🎯 Next: Start Frontend

Once backend is running, you can start the frontend:
```bash
cd ..\frontend
npm run dev
```

Frontend will run on: http://localhost:5173

---

**Phase 3 Status:** ✅ COMPLETE  
**All Backend Endpoints:** ✅ WORKING  
**API Tests:** ✅ PASSING
