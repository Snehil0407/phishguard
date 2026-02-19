from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
import uvicorn
import sys
import os
import logging
from typing import Optional, Dict, Any, List
import asyncio

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from ml.predictor import PhishGuardPredictor
from services.email_monitor import email_monitor

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
    sender_email: str = Field(..., min_length=1, description="Sender email address (required)")
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
    
    @field_validator('sender_email')
    @classmethod
    def validate_sender_email(cls, v):
        if not v or not v.strip():
            raise ValueError('Sender email address is required')
        if '@' not in v:
            raise ValueError('Invalid email address format')
        return v.strip()

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

# Email Monitoring Models
class EmailCredentialsRequest(BaseModel):
    """Request model for email credentials validation"""
    user_id: str = Field(..., description="User ID")
    email_address: str = Field(..., description="Email address to monitor")
    password: str = Field(..., description="Email password or app-specific password")
    
class EmailMonitorRequest(BaseModel):
    """Request model for starting email monitoring"""
    user_id: str = Field(..., description="User ID")
    email_address: str = Field(..., description="Email address to monitor")
    password: str = Field(..., description="Email password")
    check_interval: Optional[int] = Field(120, description="Check interval in seconds (default: 2 minutes)")

class EmailMonitorResponse(BaseModel):
    """Response model for email monitoring operations"""
    success: bool = Field(..., description="Operation success status")
    message: str = Field(..., description="Response message")
    data: Optional[Any] = Field(None, description="Additional response data")
    
class EmailAnalysisResult(BaseModel):
    """Model for email analysis result"""
    user_id: str
    email_data: Dict[str, Any]
    analysis: Dict[str, Any]
    timestamp: str

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

# Global dictionary for active monitoring tasks
active_monitoring_tasks: Dict[str, asyncio.Task] = {}

# Global dictionary for storing recent scan results (user_key -> list of results)
recent_scan_results: Dict[str, List[Dict[str, Any]]] = {}

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

# ==================== Email Monitoring Routes ====================

@app.post("/api/email/validate", response_model=EmailMonitorResponse)
async def validate_email_credentials(request: EmailCredentialsRequest):
    """
    Validate email credentials before starting monitoring
    
    Args:
        request: Email credentials to validate
        
    Returns:
        EmailMonitorResponse with validation result
    """
    try:
        logger.info(f"🔐 Validating credentials for {request.email_address}")
        
        # Validate credentials
        success, error_message = email_monitor.validate_credentials(
            request.email_address, 
            request.password
        )
        
        if success:
            return EmailMonitorResponse(
                success=True,
                message=f"Successfully validated credentials for {request.email_address}",
                data={
                    "email": request.email_address,
                    "provider": email_monitor.get_imap_server(request.email_address)
                }
            )
        else:
            return EmailMonitorResponse(
                success=False,
                message=f"Validation failed: {error_message}",
                data=None
            )
    
    except Exception as e:
        logger.error(f"❌ Error validating credentials: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/email/analyze-recent", response_model=EmailMonitorResponse)
async def analyze_recent_emails(request: EmailCredentialsRequest):
    """
    Fetch and analyze recent emails from mailbox
    
    Args:
        request: Email credentials and user ID
        
    Returns:
        EmailMonitorResponse with analysis results
    """
    try:
        logger.info(f"📧 Fetching recent emails for {request.email_address}")
        
        # Fetch and analyze recent emails
        results = await email_monitor.fetch_and_analyze_emails(
            user_id=request.user_id,
            email_address=request.email_address,
            password=request.password
        )
        
        # Count phishing detections
        phishing_count = sum(1 for r in results if r['analysis']['is_phishing'])
        
        return EmailMonitorResponse(
            success=True,
            message=f"Analyzed {len(results)} emails, found {phishing_count} potential threats",
            data={
                "total_analyzed": len(results),
                "phishing_detected": phishing_count,
                "results": results
            }
        )
    
    except Exception as e:
        logger.error(f"❌ Error analyzing recent emails: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/email/start-monitoring", response_model=EmailMonitorResponse)
async def start_email_monitoring(request: EmailMonitorRequest, background_tasks: BackgroundTasks):
    """
    Start continuous email monitoring for a user
    
    Args:
        request: Email monitoring configuration
        background_tasks: FastAPI background tasks
        
    Returns:
        EmailMonitorResponse with monitoring status
    """
    try:
        user_key = f"{request.user_id}:{request.email_address}"
        
        # Check if already monitoring - if so, stop it first
        if user_key in active_monitoring_tasks:
            logger.info(f"🔄 Restarting monitoring for {user_key} (stopping existing session)")
            task = active_monitoring_tasks[user_key]
            task.cancel()
            del active_monitoring_tasks[user_key]
            
            # Clear stored results
            if user_key in recent_scan_results:
                recent_scan_results[user_key] = []
        
        logger.info(f"🚀 Starting email monitoring for {user_key}")
        
        # Initialize results storage for this user
        if user_key not in recent_scan_results:
            recent_scan_results[user_key] = []
        
        # Define callback to store results
        async def store_result(result):
            if user_key in recent_scan_results:
                # Add to beginning (newest first)
                recent_scan_results[user_key].insert(0, result)
                # Keep only last 50 results to prevent memory issues
                recent_scan_results[user_key] = recent_scan_results[user_key][:50]
                logger.info(f"📊 Stored result for {user_key}. Total results: {len(recent_scan_results[user_key])}")
        
        # Create monitoring task with callback
        task = asyncio.create_task(
            email_monitor.start_monitoring(
                user_id=request.user_id,
                email_address=request.email_address,
                password=request.password,
                check_interval=request.check_interval,
                callback=store_result
            )
        )
        
        active_monitoring_tasks[user_key] = task
        
        return EmailMonitorResponse(
            success=True,
            message=f"Started monitoring {request.email_address}",
            data={
                "user_id": request.user_id,
                "email": request.email_address,
                "check_interval": request.check_interval,
                "status": "active"
            }
        )
    
    except Exception as e:
        logger.error(f"❌ Error starting monitoring: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/email/stop-monitoring", response_model=EmailMonitorResponse)
async def stop_email_monitoring(user_id: str, email_address: str):
    """
    Stop email monitoring for a user
    
    Args:
        user_id: User ID
        email_address: Email address being monitored
        
    Returns:
        EmailMonitorResponse with stop status
    """
    try:
        user_key = f"{user_id}:{email_address}"
        
        if user_key not in active_monitoring_tasks:
            return EmailMonitorResponse(
                success=False,
                message=f"No active monitoring found for {email_address}",
                data=None
            )
        
        logger.info(f"🛑 Stopping email monitoring for {user_key}")
        
        # Cancel monitoring task
        task = active_monitoring_tasks[user_key]
        task.cancel()
        del active_monitoring_tasks[user_key]
        
        # Clear stored results
        if user_key in recent_scan_results:
            del recent_scan_results[user_key]
        
        return EmailMonitorResponse(
            success=True,
            message=f"Stopped monitoring {email_address}",
            data={
                "user_id": user_id,
                "email": email_address,
                "status": "stopped"
            }
        )
    
    except Exception as e:
        logger.error(f"❌ Error stopping monitoring: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/email/monitoring-status", response_model=EmailMonitorResponse)
async def get_monitoring_status(user_id: str):
    """
    Get monitoring status for a user
    
    Args:
        user_id: User ID
        
    Returns:
        EmailMonitorResponse with monitoring status
    """
    try:
        # Find active monitors for this user
        user_monitors = [
            key.split(':')[1] for key in active_monitoring_tasks.keys() 
            if key.startswith(f"{user_id}:")
        ]
        
        return EmailMonitorResponse(
            success=True,
            message=f"Found {len(user_monitors)} active monitors",
            data={
                "user_id": user_id,
                "active_monitors": user_monitors,
                "monitor_count": len(user_monitors)
            }
        )
    
    except Exception as e:
        logger.error(f"❌ Error getting status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/email/recent-results", response_model=EmailMonitorResponse)
async def get_recent_results(user_id: str, email_address: str):
    """
    Get recent scan results for a monitored email
    
    Args:
        user_id: User ID
        email_address: Email address being monitored
        
    Returns:
        EmailMonitorResponse with recent scan results
    """
    try:
        user_key = f"{user_id}:{email_address}"
        
        # Get results for this user
        results = recent_scan_results.get(user_key, [])
        
        return EmailMonitorResponse(
            success=True,
            message=f"Found {len(results)} recent results",
            data={
                "user_id": user_id,
                "email": email_address,
                "results": results,
                "total": len(results)
            }
        )
    
    except Exception as e:
        logger.error(f"❌ Error getting status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
