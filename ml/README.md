# PhishGuard ML Module

AI-powered phishing detection models for Email, SMS, and URL analysis.

## 🎯 Model Performance

| Type  | Best Model      | Accuracy | Features |
|-------|----------------|----------|----------|
| Email | Random Forest  | 96.61%   | TF-IDF (5000) |
| SMS   | Random Forest  | 98.30%   | TF-IDF (3000) |
| URL   | Random Forest  | 99.80%   | 14 features |

## 📁 Structure

```
ml/
├── models/              # Trained models (.pkl files)
├── datasets/            # Training datasets
├── training/            # Training scripts
├── utils/              # Preprocessing and feature extraction
├── predictor.py        # Main prediction interface
└── README.md          # This file
```

## 🚀 Quick Start

### Training Models

```bash
cd ml/training
python train_all_models.py
```

This will train all three models (Email, SMS, URL) and save them in `ml/models/`.

### Using Predictor

```python
from ml.predictor import PhishGuardPredictor

predictor = PhishGuardPredictor()

# Email detection
result = predictor.predict_email("Your account has been suspended...")
print(f"Phishing: {result['is_phishing']}, Risk: {result['risk_score']}/100")

# SMS detection
result = predictor.predict_sms("You won a prize! Click here...")
print(f"Phishing: {result['is_phishing']}")

# URL detection
result = predictor.predict_url("http://suspicious-site.com/login")
print(f"Phishing: {result['is_phishing']}")
```

## 🛠️ Components

### Text Preprocessing (`utils/text_preprocessing.py`)
- Text cleaning and normalization
- Tokenization with NLTK
- Stopword removal
- Stemming
- Phishing keyword detection

### URL Features (`utils/url_features.py`)
- IP address detection
- HTTPS validation
- Subdomain analysis
- Special character counting
- Suspicious word detection

### Data Loader (`utils/data_loader.py`)
- Email dataset loading (10,188 samples)
- SMS dataset loading (5,572 samples)
- URL dataset loading (100,000 samples)

## 📊 Datasets Used

- **Email**: PhishingEmailData, Enron, SpamAssassin
- **SMS**: Spam and Legitimate CSV
- **URLs**: Phishing URLs + Legitimate URLs

## 🎓 Models

Each detection type uses:
1. **Logistic Regression** - Fast, interpretable
2. **Random Forest** - Best performance (selected)
3. **Naive Bayes / Gradient Boosting** - Alternative approaches

## 📈 Evaluation Metrics

- Accuracy
- Precision
- Recall
- F1-Score
- Cross-Validation (5-fold for text, 3-fold for URLs)
- Confusion Matrix

## 💾 Saved Artifacts

For each model type:
- Best model (.pkl)
- Vectorizer/Scaler (.pkl)
- Feature extractor (.pkl)
- Evaluation results (.json)
- Training report (.txt)

## 🔧 Requirements

See `backend/requirements.txt`:
- scikit-learn
- pandas
- numpy
- nltk

## 📝 Notes

- NLTK data is automatically downloaded on first run
- Models are loaded once and reused (singleton pattern)
- All predictions include explainable features
- Risk scores are normalized to 0-100 scale
- Severity levels: low (<40), medium (40-69), high (70-100)

## ✅ Testing

Run tests:
```bash
python predictor.py
```

Expected output:
- Email: Detects phishing with high confidence
- SMS: Detects phishing with medium confidence
- URL: Detects phishing with very high confidence

---

**Status: ✅ Production Ready**

All models trained, tested, and ready for integration with the FastAPI backend.
