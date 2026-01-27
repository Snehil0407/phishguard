"""
PhishGuard Prediction Interface
Unified prediction interface for Email, SMS, and URL phishing detection
"""
import pickle
import json
import os
import re
import logging
import numpy as np
from pathlib import Path

# Add parent directory to path
import sys
sys.path.append(str(Path(__file__).parent.parent))

# Configure logger
logger = logging.getLogger(__name__)

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
        
        # Email feature extraction - Trusted domains
        self.trusted_domains = [
            'google.com', 'gmail.com', 'yahoo.com', 'microsoft.com',
            'outlook.com', 'amazon.com', 'apple.com', 'paypal.com'
        ]
        
        # Free email providers
        self.free_email_providers = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
            'aol.com', 'mail.com', 'protonmail.com', 'yandex.com'
        ]
        
        # Suspicious TLDs
        self.suspicious_tlds = [
            '.xyz', '.top', '.club', '.work', '.click', '.link',
            '.stream', '.download', '.gq', '.ml', '.ga', '.cf', '.tk'
        ]
        
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
            
            # STEP 2: ML Model Prediction with Email Features
            processed_text = self.email_preprocessor.preprocess(full_text)
            text_vector = self.email_vectorizer.transform([processed_text])
            
            # Extract email features
            email_features = self._extract_email_features(sender_email or "unknown@example.com")
            
            # Combine text features with email features
            from scipy.sparse import hstack
            combined_features = hstack([text_vector, email_features])
            
            prediction = self.email_model.predict(combined_features)[0]
            probabilities = self.email_model.predict_proba(combined_features)[0]
            
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
            
            # STRONG SAFE PATTERN: Trusted domain + high green flags + low red flags = ALWAYS safe
            # This MUST come BEFORE high-priority keyword check to avoid false positives from legitimate emails
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
            
            # HIGH-PRIORITY: If 2+ high-priority keywords BUT NOT from trusted domain
            # Legitimate emails from banks/services will mention "account", "security" - that's normal
            elif (comprehensive_analysis['content_analysis']['high_priority_count'] >= 2 and 
                  not green_flags['trusted_domain']):
                final_prediction = 1  # Phishing
                adjusted_confidence = max(ml_confidence, 0.90)  # Very high confidence
                risk_score = int(adjusted_confidence * 100)
                severity = "high"
            
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
                
                # Build red_flags and green_flags lists for UI display
                "red_flags": self._build_red_flags_list(red_flags),
                "green_flags": self._build_green_flags_list(green_flags),
                
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
    
    def _build_red_flags_list(self, red_flags):
        """Build human-readable list of red flags for UI display"""
        flags_list = []
        
        # Domain/Email flags
        if red_flags.get('suspicious_domain'): flags_list.append("Suspicious or untrusted domain")
        if red_flags.get('misspelled_domain'): flags_list.append("Domain appears to be misspelled")
        if red_flags.get('free_email_provider'): flags_list.append("Using free email service")
        if red_flags.get('random_email_pattern'): flags_list.append("Random email address pattern")
        if red_flags.get('display_impersonation'): flags_list.append("Display name doesn't match email")
        
        # Authentication flags
        if red_flags.get('suspicious_tld'): flags_list.append("Suspicious top-level domain")
        if red_flags.get('email_mismatch'): flags_list.append("Email and name mismatch")
        if red_flags.get('reply_to_mismatch'): flags_list.append("Reply-to address differs from sender")
        
        # Content request flags
        if red_flags.get('sensitive_info_request'): flags_list.append("Requests sensitive information")
        if red_flags.get('suspicious_attachments'): flags_list.append("Contains suspicious attachments")
        if red_flags.get('macro_request'): flags_list.append("Requests to enable macros")
        if red_flags.get('shortened_urls'): flags_list.append("Contains shortened URLs")
        
        # Language/quality flags
        if red_flags.get('generic_greeting'): flags_list.append("Uses generic greeting")
        if red_flags.get('grammar_issues'): flags_list.append("Contains grammar or spelling errors")
        if red_flags.get('urgency_detected'): flags_list.append("Creates sense of urgency")
        if red_flags.get('emotional_manipulation'): flags_list.append("Uses emotional manipulation")
        if red_flags.get('pressure_tactics'): flags_list.append("Uses pressure tactics")
        
        # Security flags
        if red_flags.get('bypass_security_request'): flags_list.append("Asks to bypass security measures")
        if red_flags.get('unexpected_password_reset'): flags_list.append("Unexpected password reset request")
        if red_flags.get('account_compromise_claim'): flags_list.append("Claims account was compromised")
        
        # Other flags
        if red_flags.get('generous_offer'): flags_list.append("Too-good-to-be-true offer")
        if red_flags.get('legal_threat'): flags_list.append("Contains legal threats")
        if red_flags.get('qr_code'): flags_list.append("Contains QR code")
        if red_flags.get('crypto_payment_request'): flags_list.append("Requests cryptocurrency payment")
        
        return flags_list
    
    def _build_green_flags_list(self, green_flags):
        """Build human-readable list of green flags for UI display"""
        flags_list = []
        
        # Domain trust flags
        if green_flags.get('trusted_domain'): flags_list.append(f"Trusted domain: {green_flags.get('domain', 'verified')}")
        if green_flags.get('corporate_email'): flags_list.append("Corporate email address")
        if green_flags.get('no_misspelled_domain'): flags_list.append("Domain is not misspelled")
        
        # Authentication flags
        if green_flags.get('reply_to_matches'): flags_list.append("Reply-to matches sender")
        if green_flags.get('good_reputation'): flags_list.append("Good domain reputation")
        
        # Content quality flags
        if green_flags.get('personalized_greeting'): flags_list.append("Personalized greeting")
        if green_flags.get('professional_language'): flags_list.append("Professional language used")
        if green_flags.get('proper_grammar'): flags_list.append("Proper grammar and spelling")
        if green_flags.get('professional_signature'): flags_list.append("Professional email signature")
        
        # Security flags
        if green_flags.get('no_urgency'): flags_list.append("No urgency or pressure tactics")
        if green_flags.get('no_credential_request'): flags_list.append("No credential requests")
        if green_flags.get('official_links'): flags_list.append("Links to official domains")
        if green_flags.get('https_links'): flags_list.append("Secure HTTPS links")
        
        # Context flags
        if green_flags.get('clear_reason'): flags_list.append("Clear reason for contact")
        if green_flags.get('safe_attachments'): flags_list.append("Safe attachment types")
        if green_flags.get('expected_communication'): flags_list.append("Expected communication type")
        
        return flags_list
    
    def _extract_email_features(self, sender_email):
        """Extract features from sender email address for ML model"""
        import numpy as np
        features = []
        
        try:
            email = str(sender_email).lower().strip()
            
            # Extract domain
            if '@' in email:
                domain = email.split('@')[-1]
            else:
                domain = 'unknown'
            
            # Feature 1: Is trusted domain
            features.append(int(domain in self.trusted_domains))
            
            # Feature 2: Is free email provider
            features.append(int(domain in self.free_email_providers))
            
            # Feature 3: Has suspicious TLD
            features.append(int(any(domain.endswith(tld) for tld in self.suspicious_tlds)))
            
            # Feature 4: Domain length
            features.append(len(domain))
            
            # Feature 5: Number of dots in domain
            features.append(domain.count('.'))
            
            # Feature 6: Has numbers in domain
            features.append(int(bool(re.search(r'\\d', domain))))
            
            # Feature 7: Domain has hyphens
            features.append(int('-' in domain))
            
            # Feature 8: Username length (before @)
            username = email.split('@')[0] if '@' in email else ''
            features.append(len(username))
            
            # Feature 9: Username has numbers
            features.append(int(bool(re.search(r'\\d', username))))
            
            # Feature 10: Username has special chars
            features.append(int(bool(re.search(r'[^a-z0-9._-]', username))))
            
            # Feature 11: Suspicious patterns
            suspicious_usernames = ['noreply', 'admin', 'support', 'info', 'alert', 'security']
            features.append(int(
                any(sus in username for sus in suspicious_usernames) and 
                domain not in self.trusted_domains
            ))
            
            # Feature 12: Email entropy
            features.append(self._calculate_entropy(email))
            
        except Exception as e:
            # Default features if extraction fails
            features = [0] * 12
        
        return np.array(features).reshape(1, -1)
    
    def _calculate_entropy(self, text):
        """Calculate Shannon entropy of text"""
        import math
        if not text:
            return 0
        entropy = 0
        for char in set(text):
            p = text.count(char) / len(text)
            entropy -= p * math.log2(p)
        return entropy
    
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
            # STEP 1: Comprehensive SMS Analysis BEFORE ML prediction
            comprehensive_analysis = self.sms_preprocessor.analyze_sms_comprehensively(sms_text)
            
            red_flags = comprehensive_analysis['red_flags']
            green_flags = comprehensive_analysis['green_flags']
            red_flag_count = comprehensive_analysis['red_flag_count']
            green_flag_count = comprehensive_analysis['green_flag_count']
            urls_found = comprehensive_analysis['urls_found']
            
            # STEP 2: Scan URLs found in SMS using URL scanner
            suspicious_urls = []
            safe_urls = []
            if urls_found and self.url_model:
                for url in urls_found[:5]:  # Limit to 5 URLs
                    url_result = self.predict_url(url)
                    if url_result.get('is_phishing', False):
                        suspicious_urls.append({
                            'url': url,
                            'risk': url_result.get('risk_score', 0),
                            'red_flags': url_result.get('explanation', {}).get('red_flag_count', 0)
                        })
                    else:
                        safe_urls.append(url)
            
            # STEP 3: ML Model Prediction
            processed_text = self.sms_preprocessor.preprocess(sms_text)
            text_vector = self.sms_vectorizer.transform([processed_text])
            
            prediction = self.sms_model.predict(text_vector)[0]
            probabilities = self.sms_model.predict_proba(text_vector)[0]
            ml_confidence = float(probabilities[prediction])
            
            # STEP 4: Adjust prediction based on comprehensive analysis + URL scan
            adjusted_confidence = ml_confidence
            final_prediction = prediction
            
            # CRITICAL: If ANY suspicious/malicious URL found, ALWAYS classify as PHISHING
            if len(suspicious_urls) > 0:
                final_prediction = 1  # Phishing
                adjusted_confidence = max(ml_confidence, 0.95)  # Very high confidence
                severity = "high"
                risk_score = int(adjusted_confidence * 100)
            
            # If high red flag count (>8), increase phishing likelihood
            elif red_flag_count > 8:
                final_prediction = 1
                adjusted_confidence = max(ml_confidence, 0.85)
                risk_score = int(adjusted_confidence * 100)
                severity = "high" if risk_score >= 70 else "medium"
            
            # If very high green flag count (>15) and low red flags, likely safe
            elif green_flag_count > 15 and red_flag_count < 3:
                final_prediction = 0  # Safe
                adjusted_confidence = max(ml_confidence, 0.85)
                risk_score = int((1 - adjusted_confidence) * 100)
                severity = "low"
            
            else:
                # Use ML prediction
                confidence_adjustment = (green_flag_count - red_flag_count) * 0.01
                adjusted_confidence = max(0.1, min(0.99, ml_confidence + confidence_adjustment))
                final_prediction = prediction
                risk_score = int(adjusted_confidence * 100) if final_prediction == 1 else int((1 - adjusted_confidence) * 100)
                
                if risk_score >= 70:
                    severity = "high"
                elif risk_score >= 40:
                    severity = "medium"
                else:
                    severity = "low"
            
            # Extract additional stats
            stats = self.sms_preprocessor.get_text_statistics(sms_text)
            found_keywords = self.sms_preprocessor.find_phishing_keywords(sms_text)
            
            result = {
                "is_phishing": bool(final_prediction == 1),
                "confidence": adjusted_confidence,
                "risk_score": risk_score,
                "severity": severity,
                "explanation": {
                    "phishing_keywords": len(found_keywords),
                    "keywords_found": found_keywords[:10],
                    "url_count": len(urls_found),
                    "urls_found": urls_found[:5],
                    "suspicious_urls": suspicious_urls,
                    "safe_urls": safe_urls[:3],
                    "text_length": stats['length'],
                    
                    # Comprehensive flag summary
                    "red_flag_count": red_flag_count,
                    "red_flags": red_flags,
                    "green_flag_count": green_flag_count,
                    "green_flags": green_flags,
                    
                    "analysis_method": "comprehensive_40_flags_sms_hybrid"
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
            # Clean up defanged URLs (security practice: [.] -> .)
            url = url.replace('[.]', '.').replace('[:]', ':')
            
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
            
            # CRITICAL RED FLAGS: If 7+ red flags, VERY HIGH confidence phishing  
            if red_flag_count >= 7:
                final_prediction = 1  # Phishing
                adjusted_confidence = max(ml_confidence, 0.95)
                severity = "high"
            
            # STRONG RED FLAGS: If 5-6 red flags, high confidence phishing
            elif red_flag_count >= 5:
                final_prediction = 1  # Phishing
                adjusted_confidence = max(ml_confidence, 0.85)
                severity = "high"
            
            # TRUSTED DOMAIN: If trusted + 30+ green flags + 0-2 red flags, SAFE
            elif analysis['features']['is_trusted'] and green_flag_count >= 30 and red_flag_count <= 2:
                final_prediction = 0  # Safe
                adjusted_confidence = max(ml_confidence, 0.90)
                severity = "low"
            
            # STRONG GREEN FLAGS: If 35+ green flags + 0-3 red flags, likely safe
            elif green_flag_count >= 35 and red_flag_count <= 3:
                final_prediction = 0  # Safe
                adjusted_confidence = max(ml_confidence, 0.80)
                severity = "low"
            
            # MODERATE CASES: Use ML prediction with slight adjustment
            elif red_flag_count >= 3:
                # 3+ red flags = increase phishing likelihood
                if ml_prediction == 0:
                    adjusted_confidence = ml_confidence * 0.7  # Reduce confidence in "safe"
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
                    "red_flags": analysis['red_flags_list'][:10],  # Top 10
                    "red_flag_count": red_flag_count,
                    "green_flags": analysis['green_flags_list'][:10],  # Top 10
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
            logger.error(f"URL prediction error: {str(e)}")
            return {
                "error": f"Prediction error: {str(e)}",
                "is_phishing": False,
                "confidence": 0.0,
                "risk_score": 0,
                "severity": "low",
                "explanation": {
                    "error_details": str(e)
                },
                "model_type": "url"
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
