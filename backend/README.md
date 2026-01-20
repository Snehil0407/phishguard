# PhishGuard Backend

FastAPI-based backend for PhishGuard phishing detection system.

## Setup

1. Create virtual environment:
```bash
python -m venv venv
```

2. Activate virtual environment:
```bash
# Windows
venv\Scripts\activate

# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the server:
```bash
python main.py
```

The API will be available at: http://localhost:8000

## API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Endpoints

### Core Endpoints
- `GET /` - Root endpoint with API information
- `GET /health` - Health check with model status

### Analysis Endpoints
- `POST /analyze/email` - Analyze email for phishing (requires: content, optional: subject)
- `POST /analyze/sms` - Analyze SMS message for phishing (requires: message)
- `POST /analyze/url` - Analyze URL for phishing (requires: url)

## Testing

Run comprehensive tests:
```bash
python test_api.py
```

Or quick test:
```bash
cd ..
python quick_test.py
```

## Model Performance

| Type  | Model    | Accuracy |
|-------|----------|----------|
| Email | XGBoost  | 96.22%   |
| SMS   | XGBoost  | 98.12%   |
| URL   | XGBoost  | 99.79%   |
