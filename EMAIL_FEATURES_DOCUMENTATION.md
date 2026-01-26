# Email Address Feature Extraction for Phishing Detection

## Overview
The email model now includes **12 dedicated email address features** in addition to text-based TF-IDF features. This provides comprehensive analysis of the sender's email address to detect phishing attempts.

## Email Address Features (12 Features)

### Domain Security Features (3)
1. **is_trusted_domain**: Whether sender domain is in trusted list (Google, Microsoft, Amazon, etc.)
2. **is_free_email**: Whether sender uses free email provider (Gmail, Yahoo, Hotmail, etc.)
3. **has_suspicious_tld**: Whether domain uses suspicious TLD (.xyz, .top, .club, .click, etc.)

### Domain Structure Features (4)
4. **domain_length**: Length of domain name (longer domains often suspicious)
5. **domain_dots**: Number of dots in domain (subdomains can indicate phishing)
6. **domain_has_numbers**: Whether domain contains numbers (uncommon for legitimate businesses)
7. **domain_has_hyphens**: Whether domain contains hyphens (can indicate typosquatting)

### Username/Local Part Features (3)
8. **username_length**: Length of username part before @ symbol
9. **username_has_numbers**: Whether username contains numbers
10. **username_special_chars**: Whether username has unusual special characters

### Pattern Detection Features (2)
11. **suspicious_username**: Generic usernames (noreply, admin, support) from non-trusted domains
12. **email_entropy**: Randomness measure (high entropy = random characters = likely phishing)

## Integration with 40-Flag System

The email address features complement the existing 40 red flags system:

### Red Flags Using Email Address (8 flags):
- **RF1**: Suspicious Domain (not in trusted list)
- **RF2**: Misspelled Domain (typosquatting detection)
- **RF3**: Free Email Provider (corporate emails shouldn't use Gmail/Yahoo)
- **RF4**: Random Email Pattern (high entropy, random characters)
- **RF5**: Display Name Impersonation (display name doesn't match email domain)
- **RF8**: Suspicious TLD (uncommon or free TLDs)
- **RF9**: Name-Email Mismatch (sender name claims to be from one company, email is different)
- **RF37**: Non-Corporate Email Pattern (expected corporate but got personal email)

### Green Flags Using Email Address (5 flags):
- **GF1**: Official Domain (from trusted domain list)
- **GF2**: No Domain Misspellings
- **GF3**: Corporate Email (not free provider)
- **GF4**: Consistent Sender (display name matches email)
- **GF6**: Good Domain Reputation

## How Email Features Are Used

### Training Process:
1. **Data Loading**: SpamAssasin dataset includes real sender email addresses
2. **Feature Extraction**: 12 email features extracted from each sender address
3. **Feature Combination**: Email features combined with 5000 TF-IDF text features
4. **Model Training**: XGBoost/Logistic Regression learns patterns from both text and email
5. **Total Features**: ~5012 features (5000 text + 12 email)

### Prediction Process:
1. User submits email with **mandatory sender_email field**
2. System extracts 12 email features from sender address
3. Text is processed through TF-IDF vectorizer (5000 features)
4. Features combined: [text_features + email_features]
5. ML model predicts using combined feature set
6. 40-flag analysis runs in parallel for comprehensive detection

## Example Scenarios

### ✅ Legitimate Email:
```
Sender: noreply@paypal.com
Features:
- is_trusted_domain: 1 (paypal.com is trusted)
- is_free_email: 0
- has_suspicious_tld: 0
- domain_length: 10
- suspicious_username: 0 (noreply is OK from trusted domain)
Result: Low phishing probability
```

### 🚨 Phishing Email:
```
Sender: admin@paypa1-verify.xyz
Features:
- is_trusted_domain: 0 (not in trusted list)
- is_free_email: 0
- has_suspicious_tld: 1 (.xyz is suspicious)
- domain_length: 17
- domain_has_numbers: 1 (number "1" in paypa1)
- suspicious_username: 1 (admin from untrusted domain)
Result: High phishing probability
```

### 🚨 Compromised Account:
```
Sender: urgent-reset@gmail.com
Features:
- is_trusted_domain: 0 (Gmail is free provider, not corporate)
- is_free_email: 1
- username_length: 12
- suspicious_username: 1 (urgent-reset pattern)
Result: Medium-high phishing probability
```

## Benefits of Email Address Features

1. **Domain Verification**: Automatically detects typosquatting and fake domains
2. **Free Email Detection**: Identifies illegitimate use of personal email providers
3. **Pattern Recognition**: Learns suspicious patterns in email construction
4. **Entropy Analysis**: Detects randomly generated email addresses
5. **Corporate Validation**: Distinguishes corporate from personal emails
6. **TLD Awareness**: Recognizes suspicious top-level domains

## Model Training Command

```bash
cd "D:\Christ University\PG\6th trimester\phishguard"
python ml/training/train_email_model.py
```

This will:
- Load datasets with sender email addresses
- Extract 12 email features per sample
- Combine with TF-IDF text features
- Train XGBoost, Logistic Regression, and Naive Bayes
- Save best model with email feature support
- Generate evaluation report with accuracy metrics

## API Requirements

**Email analysis now requires sender_email:**
```json
{
  "subject": "Urgent: Verify your account",
  "content": "Click here to verify...",
  "sender_email": "security@paypa1-verify.xyz"  // REQUIRED
}
```

The backend validates:
- sender_email must be present
- Must contain @ symbol
- Cannot be empty string

This ensures the ML model always has email features for accurate prediction.
