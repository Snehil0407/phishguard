# PhishGuard - Machine Learning Model Architecture

## Table of Contents
1. [Overview](#overview)
2. [Email Phishing Detection Model](#email-phishing-detection-model)
3. [SMS Phishing Detection Model](#sms-phishing-detection-model)
4. [URL Phishing Detection Model](#url-phishing-detection-model)
5. [Prediction Pipeline](#prediction-pipeline)
6. [How Each Model Works](#how-each-model-works)

---

## Overview

PhishGuard uses a **hybrid machine learning approach** combining:
- **Rule-based Analysis**: 40 RED FLAGS + 40 GREEN FLAGS for comprehensive pattern detection
- **Machine Learning Models**: Trained classifiers for final prediction
- **Intelligent Decision Logic**: Combines rule-based scores with ML predictions

### Core Components
- **Text Preprocessing**: NLTK-based text normalization, tokenization, stemming
- **Feature Extraction**: TF-IDF vectorization for text, custom feature engineering
- **Model Training**: Multiple algorithms (Logistic Regression, XGBoost, Naive Bayes)
- **Hybrid Prediction**: Rule-based flags override ML when confidence is high

---

## Email Phishing Detection Model

### Architecture Overview
```
INPUT: Email Text + Subject + Sender Email + Display Name
    ↓
[STEP 1: Comprehensive Analysis - 40 RED + 40 GREEN FLAGS]
    ↓
[STEP 2: Text Preprocessing & Feature Extraction]
    ↓
[STEP 3: ML Model Prediction (XGBoost/Logistic Regression)]
    ↓
[STEP 4: URL Scanning (if URLs found)]
    ↓
[STEP 5: Hybrid Decision Logic]
    ↓
OUTPUT: is_phishing, confidence, risk_score, severity, explanation
```

### Training Process

**1. Data Sources**
- CEAS_08.csv
- Enron.csv
- Ling.csv
- Nazario.csv
- Nigerian_Fraud.csv
- PhishingEmailData.csv
- SpamAssasin.csv

**2. Feature Engineering**

**Text Features (TF-IDF)**:
- Max features: 5000
- N-grams: 1-2 (unigrams and bigrams)
- Stemming: Porter Stemmer
- Stopword removal: Enabled

**Email-Specific Features (12 features)**:
```python
1. is_trusted_domain: Domain is in trusted list (Google, Microsoft, etc.)
2. is_free_email: Uses free email provider (Gmail, Yahoo, etc.)
3. has_suspicious_tld: Domain has suspicious TLD (.xyz, .top, .club, etc.)
4. domain_length: Length of domain name
5. domain_dots: Number of dots in domain
6. domain_has_numbers: Domain contains numbers
7. domain_has_hyphens: Domain contains hyphens
8. username_length: Length of username (before @)
9. username_has_numbers: Username contains numbers
10. username_has_special_chars: Username has special characters
11. suspicious_username: Username matches suspicious patterns (noreply, admin, etc.)
12. email_entropy: Shannon entropy of email address
```

**Combined Feature Vector**: TF-IDF features + 12 email features = ~5012 features

**3. Model Training**

**Algorithms Tested**:
- Logistic Regression (max_iter=1000)
- XGBoost (n_estimators=100)
- Naive Bayes (Multinomial)

**Best Model Selection**: Highest accuracy from 5-fold cross-validation

**Performance Metrics**:
- Accuracy: Percentage of correct predictions
- Precision: TP / (TP + FP)
- Recall: TP / (TP + FN)
- F1-Score: Harmonic mean of precision and recall
- Cross-Validation: 5-fold CV for robustness

### Prediction Process

**1. Comprehensive Analysis (40 Red Flags + 40 Green Flags)**

**RED FLAGS (40 total)**:

*Domain Security (5 flags)*:
- Misspelled domain
- Free email provider (from unknown sender)
- Suspicious TLD (.xyz, .top, .club)
- Random email pattern
- Display name mismatch

*Email Headers/Authentication (8 flags)*:
- Missing SPF record
- Missing DKIM signature
- Missing DMARC policy
- Failed SPF check
- Failed DKIM check
- Reply-to differs from sender
- Suspicious headers
- Email spoofing detected

*Content Requests (5 flags)*:
- Credential request (password, login)
- Payment request
- Sensitive information request (SSN, credit card)
- Macro enablement request
- Account verification request

*Language Quality (5 flags)*:
- Generic greeting ("Dear User")
- Poor grammar
- Urgency detected ("Act now!")
- Spelling errors
- Unusual formatting

*Branding/Impersonation (5 flags)*:
- Impersonation detected
- Logo misuse
- Inconsistent branding
- Suspicious links
- Branded domain mismatch

*Security/Process Bypass (5 flags)*:
- Unexpected payment request
- QR code mention
- Cryptocurrency payment request
- Tax authority impersonation
- Legal threat

*Other Indicators (7 flags)*:
- Suspicious attachments (.exe, .zip, .js)
- Shortened URLs (bit.ly, tinyurl)
- IP address in URL
- Emotional manipulation
- Too-good-to-be-true offer
- Pressure tactics
- Compromise claim

**GREEN FLAGS (40 total)**:

*Domain Trust (5 flags)*:
- Trusted domain (Google, Microsoft, Amazon, etc.)
- Corporate email address
- No misspelled domain
- Proper domain age
- Good domain reputation

*Authentication (5 flags)*:
- Valid SPF record
- Valid DKIM signature
- Valid DMARC policy
- Reply-to matches sender
- Proper email headers

*Content Quality (10 flags)*:
- Personalized greeting (uses recipient name)
- Professional language
- Proper grammar and spelling
- Professional signature
- Clear contact information
- Detailed company information
- Proper formatting
- No urgency tactics
- No credential requests
- Legitimate business purpose

*Security (10 flags)*:
- No suspicious attachments
- HTTPS links only
- Official domain links
- No URL shorteners
- No IP addresses in URLs
- Secure email headers
- Verified sender
- No sensitive info requests
- No payment requests
- No threats or pressure

*Context (10 flags)*:
- Expected communication type
- Transactional message (order confirmation, receipt)
- Service notification
- Clear reason for contact
- Previous correspondence
- Unsubscribe link present
- Privacy policy link
- Terms of service link
- Company address included
- Phone number included

**2. URL Scanning**
- Extracts URLs from email content
- Scans each URL using URL detection model
- Flags highly suspicious URLs (≥70% risk score)
- Critical override: ANY suspicious URL → Email marked as phishing

**3. ML Model Prediction**
- Preprocesses combined text (subject + body)
- Extracts email features from sender address
- Combines TF-IDF features + email features
- Predicts using trained XGBoost/Logistic Regression model
- Generates base confidence score

**4. Hybrid Decision Logic**

**Priority 1 - Critical URL Override**:
```
IF suspicious_urls found (≥70% risk):
    → PHISHING (confidence: 95%)
```

**Priority 2 - Strong Safe Pattern**:
```
IF trusted_domain AND green_flags ≥ 12 AND red_flags ≤ 5 
   AND keywords ≤ 3 AND no_suspicious_urls:
    → SAFE (confidence: 90%)
```

**Priority 3 - High-Priority Keywords**:
```
IF high_priority_keywords ≥ 2 AND NOT trusted_domain:
    → PHISHING (confidence: 90%)
```

**Priority 4 - Fallback Safe Pattern**:
```
IF green_flags ≥ 10 AND red_flags ≤ 5 
   AND no_keywords AND no_urgency:
    → SAFE (confidence: 75%)
```

**Priority 5 - Red Flag Override**:
```
IF red_flags ≥ 3:
    → PHISHING (confidence: 80%)
```

**Default**: Use ML prediction with confidence adjustment based on flag difference

**5. Risk Score Calculation**
```python
if is_phishing:
    risk_score = confidence * 100  # Higher confidence = higher risk
else:
    risk_score = (1 - confidence) * 100  # Lower confidence = higher risk

severity = "high" if risk_score ≥ 70 else "medium" if risk_score ≥ 40 else "low"
```

### Output Format
```json
{
  "is_phishing": true,
  "confidence": 0.95,
  "risk_score": 95,
  "severity": "high",
  "explanation": {
    "phishing_keywords": 3,
    "keywords_found": ["verify", "urgent", "account"],
    "url_count": 2,
    "urls_found": ["http://fake-site.com/login"],
    "suspicious_urls": [
      {"url": "...", "risk": 85, "red_flags": 7}
    ],
    "red_flag_count": 12,
    "green_flag_count": 2,
    "red_flags": ["Suspicious domain", "Generic greeting", ...],
    "green_flags": ["Proper grammar"],
    "ml_confidence": 0.87,
    "adjusted_confidence": 0.95
  }
}
```

---

## SMS Phishing Detection Model

### Architecture Overview
```
INPUT: SMS Text
    ↓
[STEP 1: Comprehensive SMS Analysis - 40 RED + 40 GREEN FLAGS]
    ↓
[STEP 2: URL Extraction & Scanning]
    ↓
[STEP 3: Text Preprocessing & Vectorization]
    ↓
[STEP 4: ML Model Prediction (XGBoost/Logistic Regression)]
    ↓
[STEP 5: Hybrid Decision Logic]
    ↓
OUTPUT: is_phishing, confidence, risk_score, severity, explanation
```

### Training Process

**1. Data Source**
- spam and legitimate.csv (SMS dataset)

**2. Feature Engineering**

**Text Features (TF-IDF)**:
- Max features: 3000
- N-grams: 1-2 (unigrams and bigrams)
- Stemming: Porter Stemmer
- Stopword removal: Enabled

**No additional features** (SMS has no metadata like sender email)

**3. Model Training**

**Algorithms Tested**:
- Logistic Regression
- XGBoost
- Naive Bayes

**Performance Metrics**: Same as email model

### Prediction Process

**1. Comprehensive SMS Analysis**

**RED FLAGS (40 total)**:

*Urgency Indicators (10 flags)*:
- "ACT NOW", "URGENT", "IMMEDIATE"
- "LIMITED TIME", "EXPIRES TODAY"
- "LAST CHANCE", "HURRY"
- Time pressure phrases
- Deadline mentions
- Account suspension threats

*Financial Scams (10 flags)*:
- Prize/lottery mentions
- "YOU'VE WON", "WINNER"
- Money transfer requests
- Bank account mentions
- Credit card requests
- Wire transfer mentions
- Cash requests
- Investment opportunities
- Get rich quick schemes
- Cryptocurrency mentions

*Personal Information Requests (10 flags)*:
- Password requests
- OTP/verification code requests
- SSN requests
- Credit card number requests
- Bank account number requests
- PIN requests
- Security question requests
- Date of birth requests
- Mother's maiden name
- Full name and address

*Suspicious Links/Actions (10 flags)*:
- Shortened URLs (bit.ly, tinyurl)
- IP addresses in URLs
- Suspicious domains
- "Click here" without context
- Link+urgency combination
- Multiple URLs
- Unrecognized domains
- Misspelled brand names in URLs
- Login links
- Download links

**GREEN FLAGS (40 total)**:

*Legitimate Communication (10 flags)*:
- Known sender number
- Previous message history
- Transactional message (order, delivery)
- Appointment reminder
- Service notification
- Company you do business with
- Personalized content
- Expected message
- Clear business purpose
- Professional formatting

*Security Features (10 flags)*:
- Official short code
- Verified sender
- No URLs present
- No money requests
- No personal info requests
- No urgency
- No pressure tactics
- Opt-out instructions
- Company name present
- Customer service number

*Content Quality (10 flags)*:
- Proper grammar
- Professional language
- Clear information
- Specific details
- Relevant content
- Contextual message
- Appropriate length
- No spelling errors
- Coherent message
- Proper punctuation

*Trust Indicators (10 flags)*:
- Banking notification (from verified number)
- E-commerce delivery update
- Appointment confirmation
- 2FA code (expected)
- Service provider notification
- Government agency (verified)
- Healthcare provider
- Educational institution
- Utility company
- Known brand (verified)

**2. URL Scanning**
- Extracts all URLs from SMS
- Scans each using URL model
- Flags suspicious URLs
- Critical override if ANY malicious URL found

**3. ML Prediction**
- Preprocesses SMS text
- Vectorizes using TF-IDF
- Predicts using trained model

**4. Hybrid Decision Logic**

```
Priority 1: IF suspicious_urls found → PHISHING (95%)
Priority 2: IF red_flags > 8 → PHISHING (85%)
Priority 3: IF green_flags > 15 AND red_flags < 3 → SAFE (85%)
Default: ML prediction with flag-based adjustment
```

### Output Format
Same as email model with SMS-specific fields

---

## URL Phishing Detection Model

### Architecture Overview
```
INPUT: URL String
    ↓
[STEP 1: URL Parsing & Cleanup]
    ↓
[STEP 2: Comprehensive Analysis - 40 RED + 40 GREEN FLAGS]
    ↓
[STEP 3: Feature Vector Extraction (24 features)]
    ↓
[STEP 4: Feature Scaling (StandardScaler)]
    ↓
[STEP 5: ML Model Prediction (XGBoost/Logistic Regression)]
    ↓
[STEP 6: Hybrid Decision Logic]
    ↓
OUTPUT: is_phishing, confidence, risk_score, severity, explanation
```

### Training Process

**1. Data Sources**
- legitimate.csv (legitimate URLs)
- phishing_site_urls.csv (phishing URLs)

**2. Feature Engineering**

**24 Numerical Features**:
```python
1. url_length: Total URL length
2. domain_length: Domain name length
3. path_length: URL path length
4. has_ip: Uses IP address instead of domain (0/1)
5. is_https: Uses HTTPS protocol (0/1)
6. has_typosquatting: Typo in brand name (0/1)
7. is_url_shortener: URL shortener service (0/1)
8. subdomain_count: Number of subdomains
9. has_excessive_subdomains: >3 subdomains (0/1)
10. has_brand_mismatch: Brand in URL but not in domain (0/1)
11. suspicious_word_count: Count of suspicious keywords
12. is_long_url: URL length >75 characters (0/1)
13. has_port: Non-standard port number (0/1)
14. is_trusted: Trusted domain (0/1)
15. hyphen_count: Number of hyphens in domain
16. digit_count: Number of digits in domain
17. at_symbol: @ symbol in URL (0/1)
18. double_slash_redirect: // in path (0/1)
19. encoded_chars: URL-encoded characters (0/1)
20. query_length: Length of query string
21. fragment_length: Length of fragment (#)
22. tld_length: Length of top-level domain
23. special_char_count: Special characters count
24. (Additional features from comprehensive analysis)
```

**3. Feature Scaling**
- StandardScaler (mean=0, variance=1)
- Required for algorithms sensitive to feature magnitudes

**4. Model Training**

**Algorithms Tested**:
- Logistic Regression
- XGBoost
- Gradient Boosting

**Large Dataset Handling**:
- Cross-validation: 3-fold (faster than 5-fold)
- Progress tracking for feature extraction
- Efficient batch processing

### Prediction Process

**1. URL Parsing**
```python
# Cleanup defanged URLs (security practice)
url = url.replace('[.]', '.').replace('[:]', ':')

# Add protocol if missing
if not url.startswith(('http://', 'https://')):
    url = 'https://' + url

# Parse components
parsed = urlparse(url)
domain = parsed.netloc
path = parsed.path
```

**2. Comprehensive Analysis (40 Red + 40 Green Flags)**

**RED FLAGS (40 total)**:

*Domain Issues (10 flags)*:
- IP address instead of domain
- Typosquatting (paypa1.com, g00gle.com)
- Excessive subdomains (>3)
- Random domain pattern
- Suspicious TLD (.xyz, .top, .club)
- Very long domain (>30 chars)
- Domain has many hyphens (>2)
- Domain has many digits (>3)
- Free hosting service
- Newly registered domain

*URL Structure (10 flags)*:
- URL too long (>75 chars)
- @ symbol in URL (redirect trick)
- Double slash in path (//)
- Non-standard port
- URL shortener (bit.ly, tinyurl)
- Many subdomains
- Path too long (>40 chars)
- Many query parameters (>5)
- Encoded characters (%20, %2F)
- Fragment in URL

*Brand Impersonation (10 flags)*:
- Brand name in subdomain (paypal.fake.com)
- Typo in brand name (paypa1, g00gle)
- Brand mismatch (paypal in URL but not in domain)
- Multiple brand names
- Brand + login in path
- Brand + verify in path
- Homograph attack (using similar characters)
- IDN domain tricks
- Look-alike domain
- Hyphenated brand name

*Suspicious Content (10 flags)*:
- "login" in URL
- "verify" in URL
- "account" in URL
- "update" in URL
- "secure" in URL
- "banking" in URL
- Multiple suspicious words (>3)
- Executable file extension (.exe)
- Script file extension (.js, .bat)
- Archive extension (.zip, .rar)

**GREEN FLAGS (40 total)**:

*Trust Indicators (10 flags)*:
- Trusted domain (Google, Amazon, Microsoft, etc.)
- HTTPS protocol
- No IP address
- Proper domain structure
- Short URL (<50 chars)
- No suspicious words
- Corporate domain
- Known CDN
- Established domain age
- Good domain reputation

*Structure Quality (10 flags)*:
- Few subdomains (0-2)
- No hyphens in domain
- No digits in domain
- Standard port (80/443)
- Clean URL structure
- Short path (<20 chars)
- Few query parameters (<3)
- No encoded characters
- No fragments
- Proper TLD (.com, .org, .edu)

*Security Features (10 flags)*:
- HTTPS with valid certificate
- HSTS enabled
- Security headers present
- No redirect chains
- No suspicious patterns
- Matches brand official domain
- Verified SSL certificate
- Known security seals
- Clean Whois record
- Not in blacklists

*Content Indicators (10 flags)*:
- Matches expected URL pattern
- Professional URL structure
- Clear purpose in path
- Appropriate file type
- Logical subdomain use
- Static content domain
- API endpoint (documented)
- Media/CDN domain
- Documentation domain
- Known service provider

**3. Feature Vector Extraction**
- 24 numerical features extracted
- Feature vector: [url_length, domain_length, ...]

**4. Feature Scaling**
```python
features_scaled = scaler.transform([feature_vector])
```

**5. ML Model Prediction**
```python
prediction = model.predict(features_scaled)[0]
probabilities = model.predict_proba(features_scaled)[0]
ml_confidence = probabilities[prediction]
```

**6. Hybrid Decision Logic**

```python
# Critical red flags (7+) → Very high confidence phishing
if red_flag_count >= 7:
    prediction = PHISHING, confidence = 95%

# Strong red flags (5-6) → High confidence phishing
elif red_flag_count >= 5:
    prediction = PHISHING, confidence = 85%

# Trusted domain + many green flags → Safe
elif is_trusted AND green_flags >= 30 AND red_flags <= 2:
    prediction = SAFE, confidence = 90%

# Strong green flags → Safe
elif green_flags >= 35 AND red_flags <= 3:
    prediction = SAFE, confidence = 80%

# Moderate red flags → Adjust ML confidence
elif red_flags >= 3:
    if ML predicted safe: reduce confidence by 30%

# Default: Use ML prediction
else:
    prediction = ML_prediction
```

### Output Format
```json
{
  "is_phishing": false,
  "confidence": 0.92,
  "risk_score": 8,
  "severity": "low",
  "explanation": {
    "red_flags": ["Long URL", "Suspicious TLD"],
    "red_flag_count": 2,
    "green_flags": ["HTTPS", "Trusted domain", "No IP address", ...],
    "green_flag_count": 35,
    "has_ip": false,
    "is_https": true,
    "suspicious_words": 0,
    "url_length": 45,
    "subdomain_count": 1,
    "is_trusted": true,
    "ml_confidence": 0.89,
    "analysis_method": "comprehensive_hybrid"
  },
  "model_type": "url"
}
```

---

## Prediction Pipeline

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER INPUT                           │
│  (Email Text | SMS Text | URL)                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│          PhishGuardPredictor.predict_X()                │
│  - predict_email(text, subject, sender)                 │
│  - predict_sms(text)                                    │
│  - predict_url(url)                                     │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 1: COMPREHENSIVE RULE-BASED ANALYSIS              │
│  ┌─────────────────────────────────────────────┐        │
│  │  40 RED FLAGS (Phishing Indicators)         │        │
│  │  - Domain security issues                   │        │
│  │  - Content red flags                        │        │
│  │  - Language quality                         │        │
│  │  - Suspicious patterns                      │        │
│  └─────────────────────────────────────────────┘        │
│  ┌─────────────────────────────────────────────┐        │
│  │  40 GREEN FLAGS (Safety Indicators)         │        │
│  │  - Trusted sources                          │        │
│  │  - Professional content                     │        │
│  │  - Security features                        │        │
│  │  - Legitimate patterns                      │        │
│  └─────────────────────────────────────────────┘        │
│                                                          │
│  Output: red_flag_count, green_flag_count, flags_dict   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 2: URL SCANNING (if URLs found)                   │
│  - Extract URLs from content                            │
│  - Run URL model on each URL                            │
│  - Identify suspicious_urls (risk ≥ 70%)               │
│  - Identify safe_urls (verified legitimate)            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 3: TEXT PREPROCESSING                             │
│  ┌─────────────────────────────────────────────┐        │
│  │  TextPreprocessor.preprocess()              │        │
│  │  1. Lowercase conversion                    │        │
│  │  2. Remove special characters               │        │
│  │  3. Tokenization (word_tokenize)            │        │
│  │  4. Remove stopwords                        │        │
│  │  5. Stemming (PorterStemmer)               │        │
│  └─────────────────────────────────────────────┘        │
│                                                          │
│  Output: cleaned_text (string)                          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 4: FEATURE EXTRACTION                             │
│  ┌──────────────────────┬──────────────────────┐        │
│  │  EMAIL               │  SMS                 │        │
│  │  - TF-IDF (5000)     │  - TF-IDF (3000)     │        │
│  │  - Email features    │                      │        │
│  │    (12 additional)   │                      │        │
│  └──────────────────────┴──────────────────────┘        │
│  ┌─────────────────────────────────────────────┐        │
│  │  URL                                        │        │
│  │  - 24 numerical features                    │        │
│  │  - StandardScaler normalization             │        │
│  └─────────────────────────────────────────────┘        │
│                                                          │
│  Output: feature_vector                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 5: MACHINE LEARNING PREDICTION                    │
│  ┌─────────────────────────────────────────────┐        │
│  │  model.predict(features)                    │        │
│  │  - XGBoost / Logistic Regression            │        │
│  │  - Binary classification (0=safe, 1=phish)  │        │
│  └─────────────────────────────────────────────┘        │
│  ┌─────────────────────────────────────────────┐        │
│  │  model.predict_proba(features)              │        │
│  │  - Probability scores [P(safe), P(phish)]   │        │
│  └─────────────────────────────────────────────┘        │
│                                                          │
│  Output: ml_prediction, ml_confidence                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 6: HYBRID DECISION LOGIC                          │
│  ┌─────────────────────────────────────────────┐        │
│  │  Priority-based Decision Tree:              │        │
│  │                                              │        │
│  │  1. CRITICAL OVERRIDES                      │        │
│  │     - Suspicious URLs found → PHISHING      │        │
│  │     - Red flags ≥ 7 → PHISHING              │        │
│  │                                              │        │
│  │  2. STRONG SAFE PATTERNS                    │        │
│  │     - Trusted domain + green ≥ 12 → SAFE    │        │
│  │     - Green ≥ 35, red ≤ 3 → SAFE            │        │
│  │                                              │        │
│  │  3. STRONG PHISHING PATTERNS                │        │
│  │     - High-priority keywords ≥ 2 → PHISHING │        │
│  │     - Red flags ≥ 5 → PHISHING              │        │
│  │                                              │        │
│  │  4. DEFAULT: ML PREDICTION                  │        │
│  │     - Adjust confidence based on flags      │        │
│  │     - confidence += (green - red) * 0.01    │        │
│  └─────────────────────────────────────────────┘        │
│                                                          │
│  Output: final_prediction, adjusted_confidence          │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  STEP 7: RISK SCORING & SEVERITY                        │
│  ┌─────────────────────────────────────────────┐        │
│  │  if is_phishing:                            │        │
│  │      risk_score = confidence * 100          │        │
│  │  else:                                      │        │
│  │      risk_score = (1 - confidence) * 100    │        │
│  │                                              │        │
│  │  severity = "high"   if risk ≥ 70           │        │
│  │           = "medium" if risk ≥ 40           │        │
│  │           = "low"    if risk < 40           │        │
│  └─────────────────────────────────────────────┘        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  OUTPUT: PREDICTION RESULT                              │
│  {                                                       │
│    "is_phishing": boolean,                              │
│    "confidence": float (0-1),                           │
│    "risk_score": int (0-100),                           │
│    "severity": "low" | "medium" | "high",               │
│    "explanation": {                                     │
│      "red_flag_count": int,                             │
│      "green_flag_count": int,                           │
│      "red_flags": [strings],                            │
│      "green_flags": [strings],                          │
│      "keywords_found": [strings],                       │
│      "urls_found": [strings],                           │
│      "suspicious_urls": [{url, risk, flags}],          │
│      "ml_confidence": float,                            │
│      "adjusted_confidence": float,                      │
│      ... additional analysis                            │
│    }                                                     │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
```

---

## How Each Model Works

### Email Model - Step-by-Step Example

**Input**:
```
Subject: "URGENT: Account Verification Required"
Sender: "security@paypa1-secure.xyz"
Content: "Dear User, Your account will be suspended within 24 hours. 
         Click here to verify: http://paypal-verify.bad-site.com/login"
```

**Step 1: Comprehensive Analysis**
```python
RED FLAGS DETECTED (12):
✗ Misspelled domain (paypa1 instead of paypal)
✗ Suspicious TLD (.xyz)
✗ Generic greeting ("Dear User")
✗ Urgency detected ("within 24 hours", "URGENT")
✗ Account suspension threat
✗ Credential request implied
✗ Suspicious link domain
✗ Brand mismatch (paypal in URL but not in sender)
✗ Free domain provider
✗ Login link
✗ Random email pattern
✗ Impersonation detected

GREEN FLAGS DETECTED (1):
✓ Proper grammar
```

**Step 2: URL Scanning**
```python
URLs found: ["http://paypal-verify.bad-site.com/login"]

URL scan result:
- is_phishing: true
- risk_score: 95
- red_flags: 8 (has "paypal", has "login", suspicious domain, ...)
```

**Step 3: Text Preprocessing**
```python
Original: "URGENT: Account Verification Required Dear User..."
Cleaned: "urgent account verification required dear user..."
Tokenized: ["urgent", "account", "verification", "required", ...]
After stopwords: ["urgent", "account", "verification", "required", ...]
Stemmed: ["urgent", "account", "verif", "requir", ...]
```

**Step 4: Feature Extraction**
```python
TF-IDF vector: [0.0, 0.23, 0.0, 0.45, ..., 0.12] (5000 features)
Email features: [0, 1, 1, 25, 1, 1, 1, 8, 1, 0, 0, 3.2]
                 ^trusted  ^suspicious_tld  ^domain_length
Combined: 5012 features total
```

**Step 5: ML Prediction**
```python
Model: XGBoost
Prediction: 1 (Phishing)
Probabilities: [0.13, 0.87]  # [safe, phishing]
ML Confidence: 0.87
```

**Step 6: Hybrid Decision**
```python
Check Priority 1: suspicious_urls found → YES
Override ML prediction
Final: is_phishing = True
Adjusted confidence: max(0.87, 0.95) = 0.95
```

**Step 7: Risk Scoring**
```python
risk_score = 0.95 * 100 = 95
severity = "high" (≥70)
```

**Output**:
```json
{
  "is_phishing": true,
  "confidence": 0.95,
  "risk_score": 95,
  "severity": "high",
  "explanation": {
    "red_flag_count": 12,
    "green_flag_count": 1,
    "red_flags": [
      "Suspicious or untrusted domain",
      "Uses generic greeting",
      "Creates sense of urgency",
      ...
    ],
    "suspicious_urls": [
      {
        "url": "http://paypal-verify.bad-site.com/login",
        "risk": 95,
        "red_flags": 8
      }
    ],
    "ml_confidence": 0.87,
    "adjusted_confidence": 0.95
  }
}
```

### SMS Model - Step-by-Step Example

**Input**:
```
"CONGRATULATIONS! You've been selected to receive $5000. 
 Click http://bit.ly/win5k to claim your prize NOW!"
```

**Step 1: Comprehensive Analysis**
```python
RED FLAGS (8):
✗ Prize/lottery mention
✗ "YOU'VE WON" pattern
✗ Money amount mentioned
✗ URL shortener (bit.ly)
✗ Urgency ("NOW!")
✗ Pressure tactics ("CONGRATULATIONS")
✗ Too-good-to-be-true offer
✗ Unsolicited prize claim

GREEN FLAGS (0):
(No safety indicators detected)
```

**Step 2: URL Scanning**
```python
URLs found: ["http://bit.ly/win5k"]

URL scan result:
- is_phishing: true
- risk_score: 85
- is_url_shortener: true
```

**Step 3: Preprocessing**
```python
Cleaned: "congratulations selected receive number click claim prize"
```

**Step 4: Vectorization**
```python
TF-IDF: [0.0, 0.0, 0.34, ..., 0.21] (3000 features)
```

**Step 5: ML Prediction**
```python
Model: XGBoost
Prediction: 1 (Phishing)
Confidence: 0.91
```

**Step 6: Hybrid Decision**
```python
Check: suspicious_urls found → YES
Final: is_phishing = True
Adjusted confidence: 0.95
```

**Output**:
```json
{
  "is_phishing": true,
  "confidence": 0.95,
  "risk_score": 95,
  "severity": "high",
  "explanation": {
    "red_flag_count": 8,
    "green_flag_count": 0,
    "suspicious_urls": [{...}]
  }
}
```

### URL Model - Step-by-Step Example

**Input**:
```
"http://192.168.1.100/paypal-login-verify.php?id=12345&token=abc"
```

**Step 1: URL Parsing**
```python
Protocol: http
Domain: 192.168.1.100
Path: /paypal-login-verify.php
Query: id=12345&token=abc
```

**Step 2: Comprehensive Analysis**
```python
RED FLAGS (9):
✗ IP address instead of domain
✗ HTTP (not HTTPS)
✗ Brand name "paypal" not in domain
✗ "login" in path
✗ "verify" in path
✗ .php file extension
✗ Query parameters present
✗ Brand impersonation
✗ Suspicious pattern

GREEN FLAGS (2):
✓ Short URL (<75 chars)
✓ Few query parameters (<5)
```

**Step 3: Feature Extraction**
```python
Features: [
  url_length: 60,
  has_ip: 1,
  is_https: 0,
  suspicious_word_count: 3,
  is_trusted: 0,
  ...
] (24 features)
```

**Step 4: Feature Scaling**
```python
Scaled: [-0.23, 1.45, -1.12, ..., 0.67]
```

**Step 5: ML Prediction**
```python
Model: XGBoost
Prediction: 1 (Phishing)
Confidence: 0.94
```

**Step 6: Hybrid Decision**
```python
Check: red_flag_count = 9 (≥7) → CRITICAL
Final: is_phishing = True
Adjusted confidence: 0.95
```

**Output**:
```json
{
  "is_phishing": true,
  "confidence": 0.95,
  "risk_score": 95,
  "severity": "high",
  "explanation": {
    "red_flag_count": 9,
    "green_flag_count": 2,
    "has_ip": true,
    "is_https": false,
    "suspicious_words": 3
  }
}
```

---

## Key Takeaways

### 1. Hybrid Approach Benefits
- **Accuracy**: Combines rule-based precision with ML generalization
- **Explainability**: Clear reasons for predictions (40 red/green flags)
- **Robustness**: Handles edge cases better than pure ML
- **Adaptability**: Easy to add new rules without retraining

### 2. Why 40 Red + 40 Green Flags?
- **Comprehensive Coverage**: Covers all known phishing patterns
- **Balanced Analysis**: Equal weight to safety and danger indicators
- **Fine-grained Scoring**: 0-40 scale provides nuanced risk assessment
- **User Trust**: Detailed explanations build confidence

### 3. Model Performance Indicators
- **Email**: High accuracy on diverse phishing techniques
- **SMS**: Excellent at detecting financial scams and urgency tactics
- **URL**: Strong at identifying typosquatting and IP-based phishing

### 4. Continuous Improvement
- Models are retrained with new phishing samples
- Rules updated based on emerging threats
- User feedback incorporated into flag definitions
- Performance monitored through evaluation metrics

---

**Document Version**: 1.0  
**Last Updated**: January 2026  
**Author**: PhishGuard Development Team
