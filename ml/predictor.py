"""
PhishGuard Prediction Interface
Unified prediction interface for Email, SMS, and URL phishing detection
"""
import pickle
import json
import os
from pathlib import Path

# Add parent directory to path
import sys
sys.path.append(str(Path(__file__).parent.parent))

from ml.utils.text_preprocessing import TextPreprocessor
from ml.utils.url_features import URLFeatureExtractor


class PhishGuardPredictor:
    """Unified predictor for all phishing detection types"""
    
    def __init__(self, models_dir="d:/Christ University/PG/6th trimester/phishguard/ml/models"):
        """
        Initialize the predictor
        
        Args:
            models_dir: Directory containing trained models
        """
        self.models_dir = models_dir
        self.models_loaded = False
        
        # Email components
        self.email_model = None
        self.email_vectorizer = None
        self.email_preprocessor = None
        
        # SMS components
        self.sms_model = None
        self.sms_vectorizer = None
        self.sms_preprocessor = None
        
        # URL components
        self.url_model = None
        self.url_scaler = None
        self.url_feature_extractor = None
        
        # Load models
        self._load_models()
    
    def _load_models(self):
        """Load all trained models"""
        try:
            # Email model
            if os.path.exists(f"{self.models_dir}/email_model_best.pkl"):
                with open(f"{self.models_dir}/email_model_best.pkl", 'rb') as f:
                    self.email_model = pickle.load(f)
                with open(f"{self.models_dir}/email_vectorizer.pkl", 'rb') as f:
                    self.email_vectorizer = pickle.load(f)
                self.email_preprocessor = TextPreprocessor(use_stemming=True, remove_stopwords=True)
                print("✓ Email model loaded")
            
            # SMS model
            if os.path.exists(f"{self.models_dir}/sms_model_best.pkl"):
                with open(f"{self.models_dir}/sms_model_best.pkl", 'rb') as f:
                    self.sms_model = pickle.load(f)
                with open(f"{self.models_dir}/sms_vectorizer.pkl", 'rb') as f:
                    self.sms_vectorizer = pickle.load(f)
                self.sms_preprocessor = TextPreprocessor(use_stemming=True, remove_stopwords=True)
                print("✓ SMS model loaded")
            
            # URL model
            if os.path.exists(f"{self.models_dir}/url_model_best.pkl"):
                with open(f"{self.models_dir}/url_model_best.pkl", 'rb') as f:
                    self.url_model = pickle.load(f)
                with open(f"{self.models_dir}/url_scaler.pkl", 'rb') as f:
                    self.url_scaler = pickle.load(f)
                with open(f"{self.models_dir}/url_feature_extractor.pkl", 'rb') as f:
                    self.url_feature_extractor = pickle.load(f)
                print("✓ URL model loaded")
            
            self.models_loaded = True
            print("✅ All models loaded successfully!")
            
        except Exception as e:
            print(f"⚠ Error loading models: {e}")
            self.models_loaded = False
    
    def predict_email(self, email_text):
        """
        Predict if an email is phishing
        
        Args:
            email_text: Email content as string
            
        Returns:
            Dictionary with prediction results
        """
        if not self.email_model:
            return {
                "error": "Email model not loaded",
                "is_phishing": False,
                "confidence": 0.0
            }
        
        try:
            # Preprocess
            processed_text = self.email_preprocessor.preprocess(email_text)
            
            # Vectorize
            text_vector = self.email_vectorizer.transform([processed_text])
            
            # Predict
            prediction = self.email_model.predict(text_vector)[0]
            probabilities = self.email_model.predict_proba(text_vector)[0]
            
            # Get confidence
            confidence = float(probabilities[prediction])
            
            # Calculate risk score (0-100)
            risk_score = int(confidence * 100) if prediction == 1 else int((1 - confidence) * 100)
            
            # Determine severity
            if risk_score >= 70:
                severity = "high"
            elif risk_score >= 40:
                severity = "medium"
            else:
                severity = "low"
            
            # Extract features for explanation
            stats = self.email_preprocessor.get_text_statistics(email_text)
            
            result = {
                "is_phishing": bool(prediction == 1),
                "confidence": confidence,
                "risk_score": risk_score,
                "severity": severity,
                "explanation": {
                    "phishing_keywords": stats['phishing_keyword_count'],
                    "url_count": stats['url_count'],
                    "uppercase_ratio": round(stats['uppercase_ratio'], 2),
                    "text_length": stats['length']
                },
                "model_type": "email"
            }
            
            return result
            
        except Exception as e:
            return {
                "error": f"Prediction error: {str(e)}",
                "is_phishing": False,
                "confidence": 0.0
            }
    
    def predict_sms(self, sms_text):
        """
        Predict if an SMS is phishing
        
        Args:
            sms_text: SMS content as string
            
        Returns:
            Dictionary with prediction results
        """
        if not self.sms_model:
            return {
                "error": "SMS model not loaded",
                "is_phishing": False,
                "confidence": 0.0
            }
        
        try:
            processed_text = self.sms_preprocessor.preprocess(sms_text)
            text_vector = self.sms_vectorizer.transform([processed_text])
            
            prediction = self.sms_model.predict(text_vector)[0]
            probabilities = self.sms_model.predict_proba(text_vector)[0]
            confidence = float(probabilities[prediction])
            
            risk_score = int(confidence * 100) if prediction == 1 else int((1 - confidence) * 100)
            
            if risk_score >= 70:
                severity = "high"
            elif risk_score >= 40:
                severity = "medium"
            else:
                severity = "low"
            
            stats = self.sms_preprocessor.get_text_statistics(sms_text)
            
            result = {
                "is_phishing": bool(prediction == 1),
                "confidence": confidence,
                "risk_score": risk_score,
                "severity": severity,
                "explanation": {
                    "phishing_keywords": stats['phishing_keyword_count'],
                    "url_count": stats['url_count'],
                    "text_length": stats['length']
                },
                "model_type": "sms"
            }
            
            return result
            
        except Exception as e:
            return {
                "error": f"Prediction error: {str(e)}",
                "is_phishing": False,
                "confidence": 0.0
            }
    
    def predict_url(self, url):
        """
        Predict if a URL is phishing
        
        Args:
            url: URL string
            
        Returns:
            Dictionary with prediction results
        """
        if not self.url_model:
            return {
                "error": "URL model not loaded",
                "is_phishing": False,
                "confidence": 0.0
            }
        
        try:
            # Extract features
            features = self.url_feature_extractor.extract_feature_vector(url)
            
            # Scale features
            features_scaled = self.url_scaler.transform([features])
            
            # Predict
            prediction = self.url_model.predict(features_scaled)[0]
            probabilities = self.url_model.predict_proba(features_scaled)[0]
            confidence = float(probabilities[prediction])
            
            risk_score = int(confidence * 100) if prediction == 1 else int((1 - confidence) * 100)
            
            if risk_score >= 70:
                severity = "high"
            elif risk_score >= 40:
                severity = "medium"
            else:
                severity = "low"
            
            # Get feature details for explanation
            feature_dict = self.url_feature_extractor.extract_all_features(url)
            
            result = {
                "is_phishing": bool(prediction == 1),
                "confidence": confidence,
                "risk_score": risk_score,
                "severity": severity,
                "explanation": {
                    "has_ip": feature_dict['has_ip'],
                    "is_https": feature_dict['is_https'],
                    "suspicious_words": feature_dict['suspicious_word_count'],
                    "url_length": feature_dict['url_length'],
                    "subdomain_count": feature_dict['subdomain_count']
                },
                "model_type": "url"
            }
            
            return result
            
        except Exception as e:
            return {
                "error": f"Prediction error: {str(e)}",
                "is_phishing": False,
                "confidence": 0.0
            }


# Global predictor instance
_predictor = None

def get_predictor():
    """Get singleton predictor instance"""
    global _predictor
    if _predictor is None:
        _predictor = PhishGuardPredictor()
    return _predictor


if __name__ == "__main__":
    # Test the predictor
    print("=" * 70)
    print("Testing PhishGuard Predictor")
    print("=" * 70)
    
    predictor = get_predictor()
    
    if predictor.models_loaded:
        # Test email
        print("\n1. Testing Email Prediction:")
        test_email = "URGENT! Your account will be suspended. Click here to verify: http://fake-site.com"
        result = predictor.predict_email(test_email)
        print(f"Result: {result}")
        
        # Test SMS
        print("\n2. Testing SMS Prediction:")
        test_sms = "WINNER! You've won $1000! Call now to claim your prize!"
        result = predictor.predict_sms(test_sms)
        print(f"Result: {result}")
        
        # Test URL
        print("\n3. Testing URL Prediction:")
        test_url = "http://192.168.1.1/paypal-login.php"
        result = predictor.predict_url(test_url)
        print(f"Result: {result}")
    else:
        print("\n⚠ Models not loaded. Please train models first using train_all_models.py")
