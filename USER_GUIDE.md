# PhishGuard - Complete User Guide

## 🚀 Quick Start

### Both servers are already running:
- **Backend:** http://localhost:8000 ✅
- **Frontend:** http://localhost:5173 ✅

**Open your browser to:** http://localhost:5173

---

## 🎯 How to Use PhishGuard

### **1. Home Page** (http://localhost:5173/)
The landing page showcases:
- PhishGuard's AI-powered detection capabilities
- ML model accuracy statistics (96-99%)
- Feature overview with beautiful animations
- Quick access buttons to start analyzing

### **2. Dashboard** (http://localhost:5173/dashboard)
Your command center featuring:
- **Total Scans:** 156 (mock data)
- **Threats Detected:** 23
- **Safe Content:** 133
- **Today's Scans:** 12

**Quick Actions:**
- Jump to Email Analysis
- Jump to SMS Analysis
- Jump to URL Analysis

**Recent Scans:** View your last analyzed items

**Performance Overview:** See ML model accuracy

---

## 📧 Email Analysis

**URL:** http://localhost:5173/email-analysis

### How to Use:
1. Enter email subject (optional)
2. Paste the email content
3. Click "Analyze Email"
4. View the result card with:
   - ✅ or ⚠️ verdict
   - Confidence score (0-100%)
   - Risk level (Safe/Low/Medium/High/Critical)
   - Detailed explanation

### Example Phishing Emails to Test:

**Example 1: Prize Scam**
```
Subject: You Won!
Content: Congratulations! You have won $1,000,000. Click here to claim your prize immediately.
```

**Example 2: Account Security**
```
Subject: Urgent: Account Suspended
Content: Your account has been suspended due to suspicious activity. Click this link immediately to verify your identity or your account will be permanently deleted.
```

**Example 3: Banking Phish**
```
Subject: Security Alert
Content: We detected unusual activity on your account. Please verify your information by clicking here within 24 hours.
```

### Result Indicators:
- **Phishing Keywords:** Count of suspicious words
- **URL Count:** Number of links in email
- **Uppercase Ratio:** % of SHOUTING text
- **Text Length:** Character count

---

## 📱 SMS Analysis

**URL:** http://localhost:5173/sms-analysis

### How to Use:
1. Type or paste SMS message
2. Or click "Load Example" for sample messages
3. Click "Analyze SMS"
4. View risk assessment

### Example Phishing SMS to Test:

**Example 1: Urgent Account**
```
URGENT: Your account has been locked. Click http://bit.ly/fake123 to verify immediately.
```

**Example 2: Prize Winner**
```
Congratulations! You've won a FREE iPhone 15! Claim now: http://free-iphone.xyz
```

**Example 3: Bank Alert**
```
Bank Alert: Suspicious transaction detected. Verify at: http://secure-bank-verify.com
```

**Example 4: Delivery Scam**
```
Package delivery failed. Update address here: http://tracking-update.net
```

### Pre-loaded Examples:
The page includes 4 example messages you can load with one click!

---

## 🔗 URL Analysis

**URL:** http://localhost:5173/url-analysis

### How to Use:
1. Enter the URL to check
2. Or click "Load Example" for samples
3. Click "Analyze URL"
4. View security assessment

### Example Phishing URLs to Test:

**Example 1: Fake PayPal**
```
http://paypal-secure-login-verification-account.xyz
```

**Example 2: Fake Banking**
```
http://bank-account-verify-security.tk
```

**Example 3: Suspicious Domain**
```
http://microsoft-support-ticket-urgent.info
```

**Example 4: IP Address**
```
http://192.168.1.1/login.php
```

### URL Risk Factors:
- Domain age and reputation
- URL structure patterns
- Presence of keywords (login, verify, urgent)
- IP addresses instead of domains
- Suspicious TLDs (.xyz, .tk, etc.)

---

## 🎨 Understanding Risk Levels

### 🟢 **SAFE** (0-20% risk)
- Green color scheme
- No threats detected
- Content appears legitimate

### 🟡 **LOW** (21-40% risk)
- Yellow color scheme
- Minor concerns present
- Exercise normal caution

### 🟠 **MEDIUM** (41-60% risk)
- Orange color scheme
- Moderate risk indicators
- Be cautious, verify source

### 🔴 **HIGH** (61-80% risk)
- Red color scheme
- Significant threat detected
- Likely phishing attempt

### 🔴 **CRITICAL** (81-100% risk)
- Dark red color scheme
- Definite phishing attack
- Do not interact!

---

## 📊 Model Performance

Our AI models are highly accurate:

| Detection Type | Accuracy | Model |
|---------------|----------|-------|
| 📧 Email | **96.22%** | XGBoost |
| 📱 SMS | **98.12%** | XGBoost |
| 🔗 URL | **99.79%** | XGBoost |

---

## 🎨 UI Features

### **Animations**
- Smooth page transitions with Framer Motion
- Animated confidence meters
- Floating blob background on home page
- Hover effects on cards and buttons

### **Responsive Design**
- Works perfectly on mobile devices
- Hamburger menu for small screens
- Touch-friendly buttons
- Optimized layouts for all screen sizes

### **Navigation**
- Click logo to return home
- Use navbar for quick access
- Dashboard for overview
- Footer links for additional info

---

## 🧪 Testing the API

You can test the backend API directly:

### Using PowerShell:
```powershell
# Test Email Analysis
$body = @{ content = "You won $1000000!"; subject = "Winner" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/analyze/email" -Method Post -Body $body -ContentType "application/json"

# Test SMS Analysis
$body = @{ message = "URGENT: Click here now!" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/analyze/sms" -Method Post -Body $body -ContentType "application/json"

# Test URL Analysis
$body = @{ url = "http://fake-paypal.xyz" } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:8000/analyze/url" -Method Post -Body $body -ContentType "application/json"

# Health Check
Invoke-RestMethod -Uri "http://localhost:8000/health"
```

---

## 🛠️ If You Need to Restart

### Stop Servers:
Press `Ctrl+C` in each terminal window

### Start Backend:
```bash
cd "d:\Christ University\PG\6th trimester\phishguard\backend"
python main.py
```

### Start Frontend:
```bash
cd "d:\Christ University\PG\6th trimester\phishguard\frontend"
npm run dev
```

---

## 💡 Tips for Best Results

### **Email Analysis:**
- Include both subject and content for better accuracy
- Paste the full email body
- Don't modify suspicious links (keeps them detectable)

### **SMS Analysis:**
- Include the entire message
- Keep original formatting
- URLs and keywords help detection

### **URL Analysis:**
- Use the complete URL including http:// or https://
- Don't visit the URL before analyzing
- Check shortened URLs (bit.ly, tinyurl, etc.)

---

## 🔍 What PhishGuard Looks For

### **Phishing Indicators:**
✓ Urgent/threatening language  
✓ Requests for personal information  
✓ Suspicious links and URLs  
✓ Grammar and spelling errors  
✓ Generic greetings ("Dear Customer")  
✓ Unexpected attachments  
✓ Too-good-to-be-true offers  
✓ Mismatched sender addresses  
✓ Pressure to act immediately  
✓ Unusual domain names  

---

## 🎯 Real-World Use Cases

### **Scenario 1: Unexpected Email**
You receive an email claiming to be from your bank:
1. Copy the email content
2. Go to Email Analysis
3. Paste and analyze
4. Check confidence and indicators
5. If flagged, report to your bank

### **Scenario 2: SMS from Unknown Number**
You get an SMS about a package delivery:
1. Open SMS Analysis
2. Copy the message text
3. Analyze for threats
4. View risk assessment
5. Don't click links if flagged

### **Scenario 3: Social Media Link**
A friend shares a suspicious link:
1. Copy the URL (don't visit!)
2. Go to URL Analysis
3. Paste the link
4. Check the safety rating
5. Warn your friend if malicious

---

## 📱 Mobile Experience

PhishGuard works great on mobile:
- Tap the hamburger menu (☰) for navigation
- All buttons are touch-friendly
- Scroll smoothly through results
- Copy/paste directly from messages
- Works on all modern browsers

---

## 🎨 Design Elements

### **Color Palette:**
- **Background:** Slate-900 to Purple-900 gradient
- **Cards:** White with shadow effects
- **Accents:** Purple, Indigo, Cyan
- **Risk Colors:** Green, Yellow, Orange, Red

### **Typography:**
- Clean, modern fonts
- Large, readable text
- Gradient effects on headlines
- Icon integration with Lucide React

---

## 🚀 What's Next?

### **Coming in Phase 5:**
- 🔐 User authentication with Firebase
- 💾 Save scan history
- 📚 Educational awareness content
- 📊 Personal analytics dashboard
- 🔔 Threat notifications

### **Coming in Phase 6:**
- 🧩 Browser extension for Chrome/Firefox
- 🔄 Real-time URL scanning while browsing
- ⚡ Instant alerts on dangerous sites
- 🛡️ Active protection mode

---

## 📞 Need Help?

### **Check These First:**
1. Are both servers running?
2. Is your browser on http://localhost:5173?
3. Check browser console for errors (F12)
4. Try refreshing the page

### **Common Issues:**
- **Page won't load:** Backend might not be running
- **Analysis fails:** Check network tab in browser
- **No results:** Verify API endpoint is correct
- **Styling broken:** Clear cache and reload

---

## 🎉 You're Ready!

PhishGuard is fully operational with:
✅ Beautiful, professional UI  
✅ AI-powered detection (96-99% accurate)  
✅ Real-time analysis  
✅ Detailed explanations  
✅ Mobile-responsive design  
✅ Smooth animations  

**Stay safe online with PhishGuard!** 🛡️

---

**Project:** PhishGuard - MCA 6th Trimester  
**Phase 4:** ✅ COMPLETED  
**Technology:** React + FastAPI + XGBoost  
**Deployment:** Local (localhost)
