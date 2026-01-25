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
    
    def predict_email(self, email_text, email_subject="", sender_email="", sender_display=""):
        """
        Predict if an email is phishing using comprehensive analysis
        
        Args:
            email_text: Email content as string
            email_subject: Email subject line (required)
            sender_email: Sender email address (optional)
            sender_display: Sender display name (optional)
            
        Returns:
            Dictionary with prediction results and comprehensive analysis
        """
        if not self.email_model:
            return {
                "error": "Email model not loaded",
                "is_phishing": False,
                "confidence": 0.0
            }
        
        try:
            # Combine subject and body for analysis
            full_text = f"{email_subject} {email_text}".strip()
            
            # STEP 1: Comprehensive Analysis BEFORE ML prediction
            comprehensive_analysis = self.email_preprocessor.analyze_email_comprehensively(
                subject=email_subject,
                content=email_text,
                sender_email=sender_email,
                sender_display=sender_display
            )
            
            red_flags = comprehensive_analysis['red_flags']
            green_flags = comprehensive_analysis['green_flags']
            
            # STEP 2: ML Model Prediction
            processed_text = self.email_preprocessor.preprocess(full_text)
            text_vector = self.email_vectorizer.transform([processed_text])
            
            prediction = self.email_model.predict(text_vector)[0]
            probabilities = self.email_model.predict_proba(text_vector)[0]
            
            # Get ML confidence
            ml_confidence = float(probabilities[prediction])
            
            # STEP 3: Adjust prediction based on comprehensive analysis
            # If red flag score is very high (7+), increase phishing likelihood
            # If green flag score is very high (7+) and no red flags, decrease phishing likelihood
            
            adjusted_confidence = ml_confidence
            final_prediction = prediction
            
            # Extract URLs and keywords first to check for malicious links
            found_keywords = self.email_preprocessor.find_phishing_keywords(full_text)
            found_urls = self.email_preprocessor.extract_urls(full_text)
            
            # Get text statistics for uppercase ratio
            text_stats = self.email_preprocessor.get_text_statistics(full_text)
            
            # Analyze found URLs for phishing using comprehensive URL scanner
            suspicious_urls = []
            safe_urls = []
            if found_urls and self.url_model:
                for url in found_urls[:5]:  # Limit to 5 URLs
                    url_result = self.predict_url(url)
                    if url_result.get('is_phishing', False) and url_result.get('risk_score', 0) >= 70:
                        # Only flag if URL scanner found it HIGHLY suspicious (≥70% risk)
                        suspicious_urls.append({
                            'url': url,
                            'risk': url_result.get('risk_score', 0),
                            'red_flags': url_result.get('explanation', {}).get('red_flag_count', 0)
                        })
                    elif not url_result.get('is_phishing', False):
                        # Track safe URLs
                        safe_urls.append(url)
            
            # CRITICAL: If ANY highly suspicious URL found (≥70% risk), ALWAYS classify as PHISHING
            # But ONLY if the URL scanner comprehensively verified it's malicious
            if len(suspicious_urls) > 0:
                final_prediction = 1  # Phishing
                adjusted_confidence = max(ml_confidence, 0.95)  # Very high confidence
                risk_score = int(adjusted_confidence * 100)
                severity = "high"
            
            # HIGH-PRIORITY: If 2+ high-priority keywords (account, security, locked, suspension, etc.)
            elif comprehensive_analysis['content_analysis']['high_priority_count'] >= 2:
                final_prediction = 1  # Phishing
                adjusted_confidence = max(ml_confidence, 0.90)  # Very high confidence
                risk_score = int(adjusted_confidence * 100)
                severity = "high"
            
            # STRONG SAFE PATTERN: Trusted domain + high green flags + low red flags = ALWAYS safe
            # This overrides ML model when comprehensive analysis clearly shows it's legitimate
            # With 40 green flags, need at least 12+ for strong safety (30% of 40)
            elif (green_flags['trusted_domain'] and 
                  green_flags['score'] >= 12 and 
                  red_flags['score'] <= 5 and
                  len(found_keywords) <= 3 and
                  len(suspicious_urls) == 0):
                final_prediction = 0  # Safe - trusted source with strong indicators
                adjusted_confidence = 0.90  # High confidence it's safe
                risk_score = int((1 - adjusted_confidence) * 100)
                severity = "low"
            
            # FALLBACK SAFE PATTERN: Even without sender verification, strong indicators = safe
            # Good green flags + low red flags + no phishing keywords + no threats = likely safe
            # With 40 green flags, need at least 10+ for moderate safety (25% of 40)
            elif (green_flags['score'] >= 10 and 
                  red_flags['score'] <= 5 and
                  len(found_keywords) == 0 and
                  len(suspicious_urls) == 0 and
                  not red_flags['urgency_detected'] and
                  not red_flags['pressure_tactics']):
                final_prediction = 0  # Safe - strong legitimate indicators
                adjusted_confidence = 0.75  # Good confidence it's safe (lower since no sender verification)
                risk_score = int((1 - adjusted_confidence) * 100)
                severity = "low"
            
            # Safe email pattern: trusted domain with SAFE URLs verified by scanner
            elif (green_flags['trusted_domain'] and 
                  len(safe_urls) > 0 and len(suspicious_urls) == 0 and
                  not red_flags['sensitive_info_request'] and
                  len(found_keywords) <= 3):
                final_prediction = 0  # Safe
                adjusted_confidence = max(ml_confidence, 0.85)
                risk_score = int((1 - adjusted_confidence) * 100)
                severity = "low"
            
            # Safe email pattern: trusted domain, no URLs, no sensitive requests, low keywords
            elif (green_flags['trusted_domain'] and 
                  len(found_urls) == 0 and 
                  not red_flags['sensitive_info_request'] and
                  len(found_keywords) <= 3):  # 3 or fewer keywords = likely safe
                final_prediction = 0  # Safe
                adjusted_confidence = max(ml_confidence, 0.85)
                risk_score = int((1 - adjusted_confidence) * 100)
                severity = "low"
            
            # Safe pattern: URLs present but ALL verified safe by scanner
            elif (len(found_urls) > 0 and len(safe_urls) == len(found_urls) and
                  not red_flags['sensitive_info_request'] and
                  len(found_keywords) <= 3):
                final_prediction = 0  # Safe - URLs checked and verified
                adjusted_confidence = max(ml_confidence, 0.80)
                risk_score = int((1 - adjusted_confidence) * 100)
                severity = "low"
            
            # Safe pattern: No URLs, no sensitive requests, professional content, low keywords
            elif (len(found_urls) == 0 and 
                  not red_flags['sensitive_info_request'] and
                  not red_flags['urgency_detected'] and
                  len(found_keywords) <= 3):  # 3 or fewer keywords = likely safe
                final_prediction = 0  # Safe
                adjusted_confidence = max(ml_confidence, 0.80)
                risk_score = int((1 - adjusted_confidence) * 100)
                severity = "low"
            
            # CRITICAL: If 3+ red flags detected, classify as PHISHING
            # This ensures any email with multiple suspicious indicators is flagged
            elif red_flags['score'] >= 3:
                final_prediction = 1  # Phishing
                adjusted_confidence = max(ml_confidence, 0.80)
                risk_score = int(adjusted_confidence * 100)
                severity = "high" if risk_score >= 70 else "medium"
            
            # Strong RED FLAGS override - if 15+ red flags (37.5% of 40) OR >3 phishing keywords, it's highly likely phishing
            elif red_flags['score'] >= 15 or len(found_keywords) > 3:
                final_prediction = 1  # Phishing
                adjusted_confidence = max(ml_confidence, 0.85)
                risk_score = int(adjusted_confidence * 100)
                severity = "high" if risk_score >= 70 else "medium"
            
            # Strong GREEN FLAGS override - if 15+ green flags (37.5% of 40) and 0-3 red flags, likely safe
            elif green_flags['score'] >= 15 and red_flags['score'] <= 3:
                final_prediction = 0  # Safe
                adjusted_confidence = max(ml_confidence, 0.80)
                risk_score = int((1 - adjusted_confidence) * 100)
                severity = "low" if risk_score < 40 else "medium"
            
            # If no URLs, no sensitive requests, trusted domain, personalized - very likely safe
            elif (green_flags['trusted_domain'] and 
                  green_flags['personalized_greeting'] and 
                  not red_flags['sensitive_info_request'] and
                  comprehensive_analysis['content_analysis']['url_count'] == 0):
                final_prediction = 0  # Safe
                adjusted_confidence = max(ml_confidence, 0.90)
                risk_score = int((1 - adjusted_confidence) * 100)
                severity = "low"
            
            # If suspicious domain + urgency + generic greeting + login links - very likely phishing
            elif (red_flags['suspicious_domain'] and 
                  red_flags['urgency_detected'] and 
                  red_flags['generic_greeting'] and
                  red_flags['login_links']):
                final_prediction = 1  # Phishing
                adjusted_confidence = max(ml_confidence, 0.90)
                risk_score = int(adjusted_confidence * 100)
                severity = "high" if risk_score >= 70 else "medium"
            
            else:
                # Use ML prediction but adjust confidence based on flag scores
                confidence_adjustment = (green_flags['score'] - red_flags['score']) * 0.02
                adjusted_confidence = max(0.1, min(0.99, ml_confidence + confidence_adjustment))
                final_prediction = prediction
                risk_score = int(adjusted_confidence * 100) if final_prediction == 1 else int((1 - adjusted_confidence) * 100)
                
                # Determine severity
                if risk_score >= 70:
                    severity = "high"
                elif risk_score >= 40:
                    severity = "medium"
                else:
                    severity = "low"
            
            # Build comprehensive explanation
            explanation = {
                "phishing_keywords": len(found_keywords),
                "keywords_found": found_keywords[:10],
                "url_count": len(found_urls),
                "urls_found": found_urls[:5],
                "suspicious_urls": suspicious_urls,
                "safe_urls": safe_urls[:3],  # Show verified safe URLs
                "urls_scanned": len(found_urls) if found_urls else 0,
                "uppercase_ratio": round(text_stats['uppercase_ratio'] * 100, 2),  # Convert to percentage
                "text_length": comprehensive_analysis['content_analysis']['text_length'],
                
                # Comprehensive Red Flag Summary (ALL 40 flags)
                "red_flag_count": red_flags['score'],
                "red_flags_summary": {
                    # Domain Security (5 flags)
                    "misspelled_domain": red_flags.get('misspelled_domain', False),
                    "free_email_provider": red_flags.get('free_email_provider', False),
                    "suspicious_tld": red_flags.get('suspicious_tld', False),
                    "random_email_pattern": red_flags.get('random_email_pattern', False),
                    "display_name_mismatch": red_flags.get('display_name_mismatch', False),
                    
                    # Email Headers/Authentication (8 flags)
                    "missing_spf": red_flags.get('missing_spf', False),
                    "missing_dkim": red_flags.get('missing_dkim', False),
                    "missing_dmarc": red_flags.get('missing_dmarc', False),
                    "failed_spf": red_flags.get('failed_spf', False),
                    "failed_dkim": red_flags.get('failed_dkim', False),
                    "reply_to_different": red_flags.get('reply_to_different', False),
                    "suspicious_headers": red_flags.get('suspicious_headers', False),
                    "email_spoofing": red_flags.get('email_spoofing', False),
                    
                    # Content Requests (5 flags)
                    "credential_request": red_flags.get('credential_request', False),
                    "payment_request": red_flags.get('payment_request', False),
                    "sensitive_info_request": red_flags.get('sensitive_info_request', False),
                    "macro_request": red_flags.get('macro_request', False),
                    "account_verification_request": red_flags.get('account_verification_request', False),
                    
                    # Language Quality (5 flags)
                    "generic_greeting": red_flags.get('generic_greeting', False),
                    "poor_grammar": red_flags.get('poor_grammar', False),
                    "urgency_detected": red_flags.get('urgency_detected', False),
                    "urgency_phrases": red_flags.get('urgency_phrases', [])[:5],
                    "spelling_errors": red_flags.get('spelling_errors', False),
                    "unusual_formatting": red_flags.get('unusual_formatting', False),
                    
                    # Branding/Impersonation (5 flags)
                    "impersonation_detected": red_flags.get('impersonation_detected', False),
                    "logo_misuse": red_flags.get('logo_misuse', False),
                    "inconsistent_branding": red_flags.get('inconsistent_branding', False),
                    "suspicious_links": red_flags.get('suspicious_links', False),
                    "branded_domain_mismatch": red_flags.get('branded_domain_mismatch', False),
                    
                    # Security/Process Bypass (5 flags)
                    "unexpected_payment_request": red_flags.get('unexpected_payment_request', False),
                    "qr_code_mention": red_flags.get('qr_code_mention', False),
                    "crypto_payment_request": red_flags.get('crypto_payment_request', False),
                    "tax_authority_impersonation": red_flags.get('tax_authority_impersonation', False),
                    "legal_threat": red_flags.get('legal_threat', False),
                    
                    # Other Indicators (7 flags)
                    "suspicious_attachments": red_flags.get('suspicious_attachments', False),
                    "attachment_types": red_flags.get('attachment_types', []),
                    "shortened_urls": red_flags.get('shortened_urls', False),
                    "ip_address_in_url": red_flags.get('ip_address_in_url', False),
                    "emotional_manipulation": red_flags.get('emotional_manipulation', False),
                    "too_good_offer": red_flags.get('too_good_offer', False),
                    "pressure_tactics": red_flags.get('pressure_tactics', False),
                    "compromise_claim": red_flags.get('compromise_claim', False),
                    "bypass_security_request": red_flags.get('bypass_security_request', False),
                    "grammar_issues": red_flags.get('grammar_issues', False)
                },
                
                # Comprehensive Green Flag Summary (40 flags)
                "green_flag_count": green_flags['score'],
                "green_flags_summary": {
                    "trusted_domain": green_flags.get('trusted_domain', False),
                    "domain": green_flags.get('domain', ''),
                    "personalized_greeting": green_flags.get('personalized_greeting', False),
                    "professional_language": green_flags.get('professional_language', False),
                    "corporate_email": green_flags.get('corporate_email', False),
                    "no_urgency": green_flags.get('no_urgency', False),
                    "no_credential_request": green_flags.get('no_credential_request', False),
                    "proper_grammar": green_flags.get('proper_grammar', False),
                    "official_links": green_flags.get('official_links', False),
                    "transactional_message": green_flags.get('transactional_message', False)
                },
                
                "analysis_method": "comprehensive_40_flags_ml_hybrid",
                "total_flags_analyzed": 80,  # 40 red + 40 green
                "ml_confidence": round(ml_confidence, 4),
                "adjusted_confidence": round(adjusted_confidence, 4)
            }
            
            result = {
                "is_phishing": bool(final_prediction == 1),
                "confidence": adjusted_confidence,
                "risk_score": risk_score,
                "severity": severity,
                "explanation": explanation,
                "model_type": "email_comprehensive"
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
            
            # Extract detailed features
            stats = self.sms_preprocessor.get_text_statistics(sms_text)
            found_keywords = self.sms_preprocessor.find_phishing_keywords(sms_text)
            found_urls = self.sms_preprocessor.extract_urls(sms_text)
            
            # Analyze found URLs
            suspicious_urls = []
            if found_urls and self.url_model:
                for url in found_urls[:5]:
                    url_result = self.predict_url(url)
                    if url_result.get('is_phishing', False):
                        suspicious_urls.append({
                            'url': url,
                            'risk': url_result.get('risk_score', 0)
                        })
            
            # CRITICAL: If ANY suspicious/malicious URL found, ALWAYS classify as PHISHING
            if len(suspicious_urls) > 0:
                prediction = 1  # Phishing
                confidence = max(confidence, 0.95)  # Very high confidence
                risk_score = int(confidence * 100)
                severity = "high"
            else:
                risk_score = int(confidence * 100) if prediction == 1 else int((1 - confidence) * 100)
                
                if risk_score >= 70:
                    severity = "high"
                elif risk_score >= 40:
                    severity = "medium"
                else:
                    severity = "low"
            
            result = {
                "is_phishing": bool(prediction == 1),
                "confidence": confidence,
                "risk_score": risk_score,
                "severity": severity,
                "explanation": {
                    "phishing_keywords": stats['phishing_keyword_count'],
                    "keywords_found": found_keywords[:10],
                    "url_count": stats['url_count'],
                    "urls_found": found_urls[:5],
                    "suspicious_urls": suspicious_urls,
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
        Predict if a URL is phishing using comprehensive analysis + ML
        Hybrid approach: Rule-based RED/GREEN flags + ML model
        
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
            # STEP 1: Comprehensive Analysis (Rule-based)
            analysis = self.url_feature_extractor.analyze_url_comprehensively(url)
            
            red_flag_count = analysis['red_flag_count']
            green_flag_count = analysis['green_flag_count']
            
            # STEP 2: ML Model Prediction
            features = self.url_feature_extractor.extract_feature_vector(url)
            features_scaled = self.url_scaler.transform([features])
            
            ml_prediction = self.url_model.predict(features_scaled)[0]
            probabilities = self.url_model.predict_proba(features_scaled)[0]
            ml_confidence = float(probabilities[ml_prediction])
            
            # STEP 3: Hybrid Decision Logic (Rules take priority over ML)
            final_prediction = ml_prediction
            adjusted_confidence = ml_confidence
            
            # CRITICAL RED FLAGS: If 5+ red flags, ALWAYS phishing
            if red_flag_count >= 5:
                final_prediction = 1  # Phishing
                adjusted_confidence = max(ml_confidence, 0.90)
                severity = "high"
            
            # STRONG RED FLAGS: If 3-4 red flags, likely phishing
            elif red_flag_count >= 3:
                final_prediction = 1  # Phishing
                adjusted_confidence = max(ml_confidence, 0.80)
                severity = "high" if red_flag_count >= 4 else "medium"
            
            # TRUSTED DOMAIN: If trusted + 10+ green flags + 0-1 red flags, SAFE
            elif analysis['features']['is_trusted'] and green_flag_count >= 10 and red_flag_count <= 1:
                final_prediction = 0  # Safe
                adjusted_confidence = max(ml_confidence, 0.85)
                severity = "low"
            
            # STRONG GREEN FLAGS: If 12+ green flags and 0-1 red flags, likely safe
            elif green_flag_count >= 12 and red_flag_count <= 1:
                final_prediction = 0  # Safe
                adjusted_confidence = max(ml_confidence, 0.75)
                severity = "low"
            
            # MODERATE CASES: Use ML prediction with slight adjustment
            elif red_flag_count >= 2:
                # 2 red flags = increase phishing likelihood
                if ml_prediction == 0:
                    adjusted_confidence = ml_confidence * 0.8  # Reduce confidence in "safe"
                severity = "medium"
            
            else:
                # Low red flags, moderate green flags = trust ML
                severity = "low" if final_prediction == 0 else "medium"
            
            # Calculate final risk score
            if final_prediction == 1:
                risk_score = int(adjusted_confidence * 100)
            else:
                risk_score = int((1 - adjusted_confidence) * 100)
            
            # Ensure severity matches risk score
            if risk_score >= 70:
                severity = "high"
            elif risk_score >= 40:
                severity = "medium"
            else:
                severity = "low"
            
            result = {
                "is_phishing": bool(final_prediction == 1),
                "confidence": adjusted_confidence,
                "risk_score": risk_score,
                "severity": severity,
                "explanation": {
                    "red_flags": analysis['red_flags'][:5],  # Top 5
                    "red_flag_count": red_flag_count,
                    "green_flags": analysis['green_flags'][:5],  # Top 5
                    "green_flag_count": green_flag_count,
                    "has_ip": analysis['features']['has_ip'],
                    "is_https": analysis['features']['is_https'],
                    "suspicious_words": analysis['features']['suspicious_word_count'],
                    "url_length": analysis['features']['url_length'],
                    "subdomain_count": analysis['features']['subdomain_count'],
                    "is_trusted": analysis['features']['is_trusted'],
                    "ml_confidence": round(ml_confidence, 4),
                    "analysis_method": "comprehensive_hybrid"
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
