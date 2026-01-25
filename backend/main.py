from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import uvicorn
import sys
import os
import logging
from typing import Optional, Dict, Any

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.predictor import PhishGuardPredictor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Pydantic Models for Request/Response
class EmailAnalysisRequest(BaseModel):
    """Request model for email analysis"""
    content: str = Field(..., min_length=1, description="Email content to analyze")
    subject: str = Field(..., min_length=1, description="Email subject line (required)")
    sender_email: Optional[str] = Field(None, description="Sender email address (optional, improves analysis)")
    sender_display: Optional[str] = Field(None, description="Sender display name (optional, improves analysis)")
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError('Email content cannot be empty')
        return v
    
    @field_validator('subject')
    @classmethod
    def validate_subject(cls, v):
        if not v.strip():
            raise ValueError('Email subject cannot be empty')
        return v

class SMSAnalysisRequest(BaseModel):
    """Request model for SMS analysis"""
    message: str = Field(..., min_length=1, description="SMS message to analyze")
    
    @field_validator('message')
    @classmethod
    def validate_message(cls, v):
        if not v.strip():
            raise ValueError('SMS message cannot be empty')
        return v

class URLAnalysisRequest(BaseModel):
    """Request model for URL analysis"""
    url: str = Field(..., min_length=1, description="URL to analyze")
    
    @field_validator('url')
    @classmethod
    def validate_url(cls, v):
        if not v.strip():
            raise ValueError('URL cannot be empty')
        return v

class AnalysisResponse(BaseModel):
    """Response model for analysis results"""
    is_phishing: bool = Field(..., description="Whether content is classified as phishing")
    confidence: float = Field(..., ge=0, le=1, description="Prediction confidence (0-1)")
    risk_score: int = Field(..., ge=0, le=100, description="Risk score (0-100)")
    severity: str = Field(..., description="Risk severity level")
    explanation: Dict[str, Any] = Field(..., description="Detailed explanation of prediction")
    model_type: str = Field(..., description="Type of model used for prediction")

# Initialize FastAPI app
app = FastAPI(
    title="PhishGuard API",
    description="AI-Powered Phishing Detection Backend",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML predictor globally
logger.info("Initializing PhishGuard ML models...")
try:
    predictor = PhishGuardPredictor()
    logger.info("✅ PhishGuard ML models loaded successfully")
except Exception as e:
    logger.error(f"❌ Failed to load ML models: {str(e)}")
    predictor = None

@app.on_event("startup")
async def startup_event():
    """Startup event handler"""
    if predictor is None:
        logger.warning("⚠ Application started without ML models")
    else:
        logger.info("🚀 PhishGuard API started successfully")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to PhishGuard API",
        "version": "1.0.0",
        "status": "running",
        "models_loaded": predictor is not None
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy" if predictor is not None else "degraded",
        "service": "PhishGuard Backend",
        "message": "All systems operational" if predictor is not None else "ML models not loaded",
        "models_status": {
            "email": predictor.email_model is not None if predictor else False,
            "sms": predictor.sms_model is not None if predictor else False,
            "url": predictor.url_model is not None if predictor else False
        }
    }

@app.post("/analyze/email", response_model=AnalysisResponse)
async def analyze_email(request: EmailAnalysisRequest):
    """
    Analyze email content for phishing detection with comprehensive analysis
    
    Args:
        request: Email with subject, content, and optional sender information
        
    Returns:
        AnalysisResponse with prediction results and comprehensive analysis
    """
    if predictor is None:
        raise HTTPException(status_code=503, detail="ML models not loaded")
    
    try:
        # Get prediction with comprehensive analysis
        result = predictor.predict_email(
            email_text=request.content, 
            email_subject=request.subject,
            sender_email=request.sender_email or "",
            sender_display=request.sender_display or ""
        )
        
        logger.info(f"Email analysis completed: {result['severity']} risk")
        
        return AnalysisResponse(
            is_phishing=result['is_phishing'],
            confidence=result['confidence'],
            risk_score=result['risk_score'],
            severity=result['severity'],
            explanation=result['explanation'],
            model_type=result.get('model_type', 'email')
        )
    
    except Exception as e:
        logger.error(f"Error in email analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/analyze/sms", response_model=AnalysisResponse)
async def analyze_sms(request: SMSAnalysisRequest):
    """
    Analyze SMS message for phishing detection
    
    Args:
        request: SMS message content
        
    Returns:
        AnalysisResponse with prediction results
    """
    if predictor is None:
        raise HTTPException(status_code=503, detail="ML models not loaded")
    
    try:
        # Get prediction
        result = predictor.predict_sms(request.message)
        
        logger.info(f"SMS analysis completed: {result['severity']} risk")
        
        return AnalysisResponse(
            is_phishing=result['is_phishing'],
            confidence=result['confidence'],
            risk_score=result['risk_score'],
            severity=result['severity'],
            explanation=result['explanation'],
            model_type="sms"
        )
    
    except Exception as e:
        logger.error(f"Error in SMS analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@app.post("/analyze/url", response_model=AnalysisResponse)
async def analyze_url(request: URLAnalysisRequest):
    """
    Analyze URL for phishing detection
    
    Args:
        request: URL to analyze
        
    Returns:
        AnalysisResponse with prediction results
    """
    if predictor is None:
        raise HTTPException(status_code=503, detail="ML models not loaded")
    
    try:
        # Get prediction
        result = predictor.predict_url(request.url)
        
        logger.info(f"URL analysis completed: {result['severity']} risk")
        
        return AnalysisResponse(
            is_phishing=result['is_phishing'],
            confidence=result['confidence'],
            risk_score=result['risk_score'],
            severity=result['severity'],
            explanation=result['explanation'],
            model_type="url"
        )
    
    except Exception as e:
        logger.error(f"Error in URL analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
