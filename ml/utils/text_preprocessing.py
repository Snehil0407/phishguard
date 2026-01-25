"""
Text preprocessing utilities for PhishGuard ML models
"""
import re
import string
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer, WordNetLemmatizer

# Download required NLTK data
def download_nltk_data():
    """Download required NLTK datasets"""
    try:
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        nltk.download('wordnet', quiet=True)
        nltk.download('averaged_perceptron_tagger', quiet=True)
        print("✓ NLTK data downloaded successfully")
    except Exception as e:
        print(f"⚠ Warning: Could not download NLTK data: {e}")

class TextPreprocessor:
    """Text preprocessing class for cleaning and normalizing text"""
    
    def __init__(self, use_stemming=True, use_lemmatization=False, remove_stopwords=True):
        """
        Initialize the preprocessor
        
        Args:
            use_stemming: Whether to apply stemming
            use_lemmatization: Whether to apply lemmatization
            remove_stopwords: Whether to remove stopwords
        """
        self.use_stemming = use_stemming
        self.use_lemmatization = use_lemmatization
        self.remove_stopwords = remove_stopwords
        
        # Initialize tools
        self.stemmer = PorterStemmer() if use_stemming else None
        self.lemmatizer = WordNetLemmatizer() if use_lemmatization else None
        self.stop_words = set(stopwords.words('english')) if remove_stopwords else set()
        
        # Common phishing keywords (removed legitimate company names)
        self.phishing_keywords = [
            'urgent', 'verify', 'suspended', 'confirm', 'password',
            'click', 'winner', 'prize', 'congratulations', 
            'limited', 'expire', 'update', 'alert', 'warning',
            'locked', 'unusual', 'blocked', 'compromised',
            'reactivate', 'validate', 'unauthorized', 'suspension'
        ]
        
        # HIGH-PRIORITY phishing keywords - very strong indicators when appearing together
        # If 2+ of these appear in same email, it's highly likely phishing
        self.high_priority_keywords = [
            'account', 'security', 'locked', 'suspension', 'suspended',
            'verify', 'urgent', 'blocked', 'compromised', 'unauthorized'
        ]
        
        # Context-based phishing indicators (only suspicious in certain contexts)
        self.context_keywords = [
            'bank', 'credit', 'card', 
            'login', 'signin', 'verification', 'link', 'free'
        ]
        
        # Legitimate company names (not phishing indicators by themselves)
        self.company_names = [
            'paypal', 'amazon', 'apple', 'microsoft', 'google',
            'facebook', 'netflix', 'ebay'
        ]
        
        # RED FLAG indicators
        self.urgency_phrases = [
            'act now', 'immediate action', 'within 24 hours', 'account will be',
            'suspended', 'urgent', 'expires soon', 'limited time', 'act immediately',
            'respond now', 'verify now', 'confirm immediately', 'time sensitive'
        ]
        
        self.generic_greetings = [
            'dear user', 'dear customer', 'dear member', 'hello user',
            'dear sir/madam', 'valued customer', 'dear client'
        ]
        
        self.sensitive_info_requests = [
            'password', 'credit card', 'social security', 'ssn', 'pin',
            'otp', 'one time password', 'verification code', 'security code',
            'cvv', 'card number', 'account number', 'routing number'
        ]
        
        self.pressure_tactics = [
            'you\'ve won', 'claim your prize', 'congratulations',
            'selected winner', 'free gift', 'exclusive offer',
            'last chance', 'don\'t miss', 'act fast'
        ]
        
        self.suspicious_file_extensions = [
            '.exe', '.zip', '.rar', '.xlsm', '.html', '.iso', 
            '.img', '.js', '.jar', '.bat', '.cmd', '.scr'
        ]
        
        # Trusted domains (GREEN FLAG)
        self.trusted_domains = [
            'google.com', 'gmail.com', 'yahoo.com', 'microsoft.com',
            'outlook.com', 'amazon.com', 'amazon.in', 'apple.com',
            'paypal.com', 'facebook.com', 'linkedin.com', 'github.com',
            'stackoverflow.com'
        ]
    
    def clean_text(self, text):
        """
        Clean and normalize text
        
        Args:
            text: Input text string
            
        Returns:
            Cleaned text string
        """
        if not isinstance(text, str):
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove URLs (keep for URL feature extraction later)
        # text = re.sub(r'http\S+|www\.\S+', '', text)
        
        # Remove email addresses
        text = re.sub(r'\S+@\S+', 'emailaddr', text)
        
        # Remove numbers but keep them for certain features
        text = re.sub(r'\d+', 'number', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep some punctuation
        text = re.sub(r'[^\w\s.,!?]', '', text)
        
        return text.strip()
    
    def tokenize(self, text):
        """
        Tokenize text into words
        
        Args:
            text: Input text string
            
        Returns:
            List of tokens
        """
        try:
            tokens = word_tokenize(text)
        except:
            # Fallback to simple split if tokenization fails
            tokens = text.split()
        
        return tokens
    
    def remove_stopwords_from_tokens(self, tokens):
        """
        Remove stopwords from token list
        
        Args:
            tokens: List of tokens
            
        Returns:
            List of tokens without stopwords
        """
        if not self.remove_stopwords:
            return tokens
        
        return [token for token in tokens if token not in self.stop_words]
    
    def stem_tokens(self, tokens):
        """
        Apply stemming to tokens
        
        Args:
            tokens: List of tokens
            
        Returns:
            List of stemmed tokens
        """
        if not self.use_stemming or not self.stemmer:
            return tokens
        
        return [self.stemmer.stem(token) for token in tokens]
    
    def lemmatize_tokens(self, tokens):
        """
        Apply lemmatization to tokens
        
        Args:
            tokens: List of tokens
            
        Returns:
            List of lemmatized tokens
        """
        if not self.use_lemmatization or not self.lemmatizer:
            return tokens
        
        return [self.lemmatizer.lemmatize(token) for token in tokens]
    
    def preprocess(self, text):
        """
        Complete preprocessing pipeline
        
        Args:
            text: Input text string
            
        Returns:
            Preprocessed text string
        """
        # Clean text
        text = self.clean_text(text)
        
        # Tokenize
        tokens = self.tokenize(text)
        
        # Remove stopwords
        tokens = self.remove_stopwords_from_tokens(tokens)
        
        # Apply stemming or lemmatization
        if self.use_stemming:
            tokens = self.stem_tokens(tokens)
        elif self.use_lemmatization:
            tokens = self.lemmatize_tokens(tokens)
        
        # Join tokens back to string
        return ' '.join(tokens)
    
    def extract_urls(self, text):
        """
        Extract URLs from text
        
        Args:
            text: Input text string
            
        Returns:
            List of URLs found in text
        """
        url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        urls = re.findall(url_pattern, text)
        return urls
    
    def count_phishing_keywords(self, text):
        """
        Count phishing-related keywords in text
        
        Args:
            text: Input text string
            
        Returns:
            Number of phishing keywords found
        """
        text_lower = text.lower()
        count = sum(1 for keyword in self.phishing_keywords if keyword in text_lower)
        return count
    
    def find_phishing_keywords(self, text):
        """
        Find actual phishing keywords present in text
        
        Args:
            text: Input text string
            
        Returns:
            List of phishing keywords found
        """
        text_lower = text.lower()
        found_keywords = [keyword for keyword in self.phishing_keywords if keyword in text_lower]
        return list(set(found_keywords))  # Remove duplicates
    
    def find_high_priority_keywords(self, text):
        """
        Find high-priority phishing keywords (account, security, locked, suspension, etc.)
        These are strong indicators when 2+ appear together
        
        Args:
            text: Input text string
            
        Returns:
            List of high-priority keywords found
        """
        text_lower = text.lower()
        found_keywords = [keyword for keyword in self.high_priority_keywords if keyword in text_lower]
        return list(set(found_keywords))  # Remove duplicates
    
    def get_text_statistics(self, text):
        """
        Extract various text statistics
        
        Args:
            text: Input text string
            
        Returns:
            Dictionary of text statistics
        """
        return {
            'length': len(text),
            'word_count': len(text.split()),
            'uppercase_ratio': sum(1 for c in text if c.isupper()) / len(text) if len(text) > 0 else 0,
            'digit_count': sum(1 for c in text if c.isdigit()),
            'special_char_count': sum(1 for c in text if c in string.punctuation),
            'url_count': len(self.extract_urls(text)),
            'phishing_keyword_count': self.count_phishing_keywords(text)
        }
    
    def detect_urgency(self, text):
        """
        Detect urgent/threatening language (RED FLAG #2)
        
        Returns:
            (has_urgency: bool, phrases_found: list)
        """
        text_lower = text.lower()
        found_phrases = [phrase for phrase in self.urgency_phrases if phrase in text_lower]
        return len(found_phrases) > 0, found_phrases
    
    def detect_greeting_type(self, text):
        """
        Detect if greeting is generic or personalized (RED FLAG #3 vs GREEN FLAG #2)
        
        Returns:
            'generic', 'personalized', or 'none'
        """
        text_lower = text.lower()
        
        # Check for generic greetings
        for greeting in self.generic_greetings:
            if greeting in text_lower:
                return 'generic'
        
        # Check for personalized greetings (contains name-like patterns)
        if re.search(r'dear [A-Z][a-z]+', text) or re.search(r'hi [A-Z][a-z]+', text):
            return 'personalized'
        
        return 'none'
    
    def detect_sensitive_info_request(self, text):
        """
        Detect requests for sensitive information (RED FLAG #4)
        
        Returns:
            (has_request: bool, items_found: list)
        """
        text_lower = text.lower()
        found_items = [item for item in self.sensitive_info_requests if item in text_lower]
        return len(found_items) > 0, found_items
    
    def detect_embedded_login_links(self, text):
        """
        Detect embedded external links asking for login (RED FLAG #5)
        
        Returns:
            (has_login_links: bool, count: int)
        """
        text_lower = text.lower()
        urls = self.extract_urls(text)
        
        login_keywords = ['login', 'signin', 'sign-in', 'verify', 'confirm', 'account']
        
        # Check if URL context contains login keywords
        for url in urls:
            url_lower = url.lower()
            # Check if URL itself contains login keywords
            if any(keyword in url_lower for keyword in login_keywords):
                return True, len(urls)
            
            # Check text around URL for login keywords
            url_index = text_lower.find(url.lower())
            if url_index != -1:
                context_start = max(0, url_index - 100)
                context_end = min(len(text_lower), url_index + len(url) + 100)
                context = text_lower[context_start:context_end]
                if any(keyword in context for keyword in login_keywords):
                    return True, len(urls)
        
        return False, len(urls)
    
    def detect_suspicious_attachments(self, text):
        """
        Detect mentions of suspicious file types (RED FLAG #6)
        
        Returns:
            (has_suspicious: bool, extensions_found: list)
        """
        text_lower = text.lower()
        found_extensions = [ext for ext in self.suspicious_file_extensions if ext in text_lower]
        
        # Also check for generic attachment mentions
        attachment_keywords = ['attachment', 'attached file', 'download', 'open file']
        has_attachment_mention = any(keyword in text_lower for keyword in attachment_keywords)
        
        return len(found_extensions) > 0 or has_attachment_mention, found_extensions
    
    def detect_sender_domain_mismatch(self, sender_display, sender_email):
        """
        Detect mismatch between sender name and email (RED FLAG #7)
        
        Args:
            sender_display: Display name (e.g., "Google Security")
            sender_email: Email address (e.g., "noreply@fake-google.com")
            
        Returns:
            (has_mismatch: bool, details: str)
        """
        if not sender_display or not sender_email:
            return False, "No sender information"
        
        display_lower = sender_display.lower()
        email_lower = sender_email.lower()
        
        # Extract domain from email
        domain_match = re.search(r'@([a-zA-Z0-9.-]+)', email_lower)
        if not domain_match:
            return True, "Invalid email format"
        
        domain = domain_match.group(1)
        
        # Check if display name mentions a company but email doesn't match
        companies = ['google', 'microsoft', 'amazon', 'paypal', 'apple', 'facebook', 'bank']
        for company in companies:
            if company in display_lower and company not in domain:
                return True, f"Display shows '{company}' but domain is '{domain}'"
        
        return False, "No mismatch detected"
    
    def detect_grammar_issues(self, text):
        """
        Detect poor grammar or unusual formatting (RED FLAG #8)
        
        Returns:
            (has_issues: bool, issue_count: int)
        """
        issues = 0
        
        # Check for excessive capitalization
        if len(text) > 10:
            caps_ratio = sum(1 for c in text if c.isupper()) / len(text)
            if caps_ratio > 0.3:  # More than 30% capitals
                issues += 1
        
        # Check for multiple exclamation/question marks
        if re.search(r'[!?]{2,}', text):
            issues += 1
        
        # Check for random capitalization in middle of words
        if re.search(r'\w[A-Z]{2,}', text):
            issues += 1
        
        # Check for unusual spacing
        if re.search(r'\s{3,}', text):
            issues += 1
        
        # Check for mix of languages or character sets
        if re.search(r'[А-Яа-я]', text) or re.search(r'[Α-Ωα-ω]', text):  # Cyrillic or Greek
            issues += 1
        
        return issues > 0, issues
    
    def detect_pressure_tactics(self, text):
        """
        Detect pressure tactics involving rewards or losses (RED FLAG #9)
        
        Returns:
            (has_pressure: bool, tactics_found: list)
        """
        text_lower = text.lower()
        found_tactics = [tactic for tactic in self.pressure_tactics if tactic in text_lower]
        return len(found_tactics) > 0, found_tactics
    
    def check_trusted_domain(self, email_or_url):
        """
        Check if domain is from trusted source (GREEN FLAG #1)
        
        Returns:
            (is_trusted: bool, domain: str)
        """
        if not email_or_url:
            return False, ""
        
        text_lower = email_or_url.lower()
        
        # Extract domain
        domain_match = re.search(r'@?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})', text_lower)
        if not domain_match:
            return False, ""
        
        domain = domain_match.group(1)
        
        # Check against trusted domains
        for trusted in self.trusted_domains:
            if domain == trusted or domain.endswith('.' + trusted):
                return True, domain
        
        return False, domain
    
    def analyze_email_comprehensively(self, subject, content, sender_email="", sender_display=""):
        """
        Comprehensive email analysis using ALL 40 RED and 40 GREEN flag indicators
        
        Args:
            subject: Email subject line
            content: Email body content
            sender_email: Sender email address (optional)
            sender_display: Sender display name (optional)
            
        Returns:
            Dictionary with comprehensive analysis results (40 red flags + 40 green flags)
        """
        full_text = f"{subject} {content}"
        
        # ==================== RED FLAGS (40 indicators) ====================
        # RF1-5: Domain/Email Security
        is_trusted_domain, domain = self.check_trusted_domain(sender_email)
        rf1_suspicious_domain = not is_trusted_domain
        rf2_misspelled_domain = self._check_domain_misspelling(sender_email)
        rf3_free_email = self._check_free_email_provider(sender_email)
        rf4_random_email = self._check_random_email_pattern(sender_email)
        rf5_display_impersonation = self._check_display_name_mismatch(sender_display, sender_email)
        
        # RF6-10: Email Headers
        rf6_reply_to_mismatch = False  # Requires email headers
        rf7_new_domain = False  # Requires WHOIS lookup
        rf8_suspicious_tld = self._check_suspicious_tld(sender_email)
        rf9_email_mismatch = self._check_name_email_mismatch(sender_display, sender_email)
        rf10_external_internal_claim = self._check_external_internal_mismatch(sender_email, content)
        
        # RF11-15: Authentication (placeholders - requires email headers)
        rf11_spf_failure = False
        rf12_dkim_failure = False
        rf13_dmarc_failure = False
        
        # RF14-18: Content Requests
        has_sensitive_request, sensitive_items = self.detect_sensitive_info_request(full_text)
        rf14_credential_request = has_sensitive_request
        rf15_suspicious_attachments, attachment_types = self.detect_suspicious_attachments(full_text)
        rf16_macro_request = self._check_macro_request(content)
        rf17_shortened_urls = self._check_shortened_urls(content)
        rf18_url_mismatch = self._check_url_text_mismatch(content)
        
        # RF19-23: Language/Content Quality
        has_grammar_issues, grammar_count = self.detect_grammar_issues(full_text)
        rf19_grammar_errors = has_grammar_issues
        rf20_emotional_manipulation, emotion_phrases = self._check_emotional_manipulation(full_text)
        rf21_unexpected_invoice = self._check_unexpected_payment_request(content)
        has_pressure, pressure_phrases = self.detect_pressure_tactics(full_text)
        rf22_pressure_tactics = has_pressure
        rf23_no_signature = self._check_missing_signature(content)
        
        # RF24-28: Branding/Formatting
        rf24_inconsistent_branding = False  # Requires visual analysis
        rf25_qr_code = self._check_qr_code_mention(content)
        rf26_crypto_payment = self._check_crypto_payment_request(content)
        rf27_unusual_formatting = self._check_unusual_formatting(full_text)
        rf28_account_compromise_claim = self._check_compromise_claim(content)
        
        # RF29-33: Security/Process
        rf29_bypass_security = self._check_bypass_security_request(content)
        rf30_odd_hours = False  # Requires timestamp
        rf31_unexpected_reset = self._check_unexpected_password_reset(content)
        rf32_external_login = self._check_external_login_request(content)
        rf33_unknown_sender = not self._check_known_sender(sender_email)
        
        # RF34-40: Other Indicators
        has_urgency, urgency_phrases = self.detect_urgency(full_text)
        greeting_type = self.detect_greeting_type(full_text)
        rf34_generic_greeting = (greeting_type == 'generic')
        rf35_generous_offer = self._check_too_good_offer(content)
        rf36_legal_threat = self._check_legal_threat(content)
        rf37_non_corporate_pattern = self._check_non_corporate_email(sender_email)
        rf38_multiple_red_flags = False  # Calculated at end
        rf39_urgency = has_urgency
        rf40_excessive_punctuation = self._check_excessive_punctuation(full_text)
        
        # ==================== GREEN FLAGS (40 indicators) ====================
        # GF1-5: Domain/Email Trust
        gf1_official_domain = is_trusted_domain
        gf2_no_misspellings = not rf2_misspelled_domain
        gf3_corporate_email = not rf3_free_email
        gf4_consistent_sender = not rf5_display_impersonation
        gf5_reply_to_matches = not rf6_reply_to_mismatch
        
        # GF6-10: Authentication
        gf6_good_domain_reputation = is_trusted_domain
        gf7_valid_spf = not rf11_spf_failure
        gf8_valid_dkim = not rf12_dkim_failure
        gf9_valid_dmarc = not rf13_dmarc_failure
        has_personalized = (greeting_type == 'personalized')
        gf10_personalized_greeting = has_personalized
        
        # GF11-15: Content Quality
        gf11_professional_language = not rf19_grammar_errors
        gf12_no_urgency = not rf39_urgency
        gf13_no_credential_request = not rf14_credential_request
        urls = self.extract_urls(full_text)
        has_login_links, url_count = self.detect_embedded_login_links(full_text)
        gf14_official_links = (len(urls) > 0 and is_trusted_domain and not has_login_links)
        gf15_https_links = self._check_all_https(urls)
        
        # GF16-20: Contextual Trust
        gf16_expected_communication = False  # Requires user history
        gf17_safe_attachments = not rf15_suspicious_attachments
        gf18_clear_reason = self._check_clear_purpose(content)
        gf19_proper_grammar = not rf19_grammar_errors
        gf20_professional_signature = not rf23_no_signature
        
        # GF21-25: Branding/Format
        gf21_consistent_branding = not rf24_inconsistent_branding
        gf22_contact_details = self._check_contact_details_present(content)
        gf23_unsubscribe_option = self._check_unsubscribe_option(content)
        gf24_no_shortened_urls = not rf17_shortened_urls
        gf25_link_preview_matches = not rf18_url_mismatch
        
        # GF26-30: Security Indicators
        gf26_no_embedded_forms = not self._check_embedded_form(content)
        gf27_known_pattern = self._check_known_communication_pattern(content, is_trusted_domain)
        gf28_transactional = self._check_transactional_message(content)
        gf29_official_support_address = self._check_official_support_address(sender_email)
        gf30_no_emotional_manipulation = not rf20_emotional_manipulation
        
        # GF31-35: Sender History
        gf31_known_sender = not rf33_unknown_sender
        gf32_business_hours = not rf30_odd_hours
        gf33_no_unusual_payment = not rf21_unexpected_invoice
        gf34_no_qr_codes = not rf25_qr_code
        gf35_privacy_policy = self._check_privacy_policy(content)
        
        # GF36-40: Overall Quality
        gf36_clear_call_to_action = self._check_clear_cta(content)
        gf37_subject_matches_content = self._check_subject_content_match(subject, content)
        gf38_digitally_signed = False  # Requires email headers
        gf39_low_risk_overall = False  # Calculated at end
        gf40_no_pressure = not rf22_pressure_tactics
        
        # Calculate comprehensive scores
        red_flag_list = [
            rf1_suspicious_domain, rf2_misspelled_domain, rf3_free_email, rf4_random_email,
            rf5_display_impersonation, rf6_reply_to_mismatch, rf7_new_domain, rf8_suspicious_tld,
            rf9_email_mismatch, rf10_external_internal_claim, rf11_spf_failure, rf12_dkim_failure,
            rf13_dmarc_failure, rf14_credential_request, rf15_suspicious_attachments, rf16_macro_request,
            rf17_shortened_urls, rf18_url_mismatch, rf19_grammar_errors, rf20_emotional_manipulation,
            rf21_unexpected_invoice, rf22_pressure_tactics, rf23_no_signature, rf24_inconsistent_branding,
            rf25_qr_code, rf26_crypto_payment, rf27_unusual_formatting, rf28_account_compromise_claim,
            rf29_bypass_security, rf30_odd_hours, rf31_unexpected_reset, rf32_external_login,
            rf33_unknown_sender, rf34_generic_greeting, rf35_generous_offer, rf36_legal_threat,
            rf37_non_corporate_pattern, rf39_urgency, rf40_excessive_punctuation
        ]
        
        green_flag_list = [
            gf1_official_domain, gf2_no_misspellings, gf3_corporate_email, gf4_consistent_sender,
            gf5_reply_to_matches, gf6_good_domain_reputation, gf7_valid_spf, gf8_valid_dkim,
            gf9_valid_dmarc, gf10_personalized_greeting, gf11_professional_language, gf12_no_urgency,
            gf13_no_credential_request, gf14_official_links, gf15_https_links, gf16_expected_communication,
            gf17_safe_attachments, gf18_clear_reason, gf19_proper_grammar, gf20_professional_signature,
            gf21_consistent_branding, gf22_contact_details, gf23_unsubscribe_option, gf24_no_shortened_urls,
            gf25_link_preview_matches, gf26_no_embedded_forms, gf27_known_pattern, gf28_transactional,
            gf29_official_support_address, gf30_no_emotional_manipulation, gf31_known_sender,
            gf32_business_hours, gf33_no_unusual_payment, gf34_no_qr_codes, gf35_privacy_policy,
            gf36_clear_call_to_action, gf37_subject_matches_content, gf38_digitally_signed, gf40_no_pressure
        ]
        
        red_flag_score = sum(red_flag_list)
        green_flag_score = sum(green_flag_list)
        
        # Update final calculated flags
        rf38_multiple_red_flags = (red_flag_score >= 5)
        gf39_low_risk_overall = (green_flag_score >= 20 and red_flag_score <= 5)
        
        # Recalculate if these changed
        if rf38_multiple_red_flags and rf38_multiple_red_flags not in red_flag_list:
            red_flag_score += 1
        if gf39_low_risk_overall and gf39_low_risk_overall not in green_flag_list:
            green_flag_score += 1
        
        # Extract keywords for analysis
        keywords = self.find_phishing_keywords(full_text)
        high_priority_keywords = self.find_high_priority_keywords(full_text)
        
        return {
            'red_flags': {
                'score': red_flag_score,
                # Domain/Email (1-5)
                'suspicious_domain': rf1_suspicious_domain,
                'misspelled_domain': rf2_misspelled_domain,
                'free_email_provider': rf3_free_email,
                'random_email_pattern': rf4_random_email,
                'display_impersonation': rf5_display_impersonation,
                # Headers (6-13)
                'reply_to_mismatch': rf6_reply_to_mismatch,
                'new_domain': rf7_new_domain,
                'suspicious_tld': rf8_suspicious_tld,
                'email_mismatch': rf9_email_mismatch,
                'external_internal_claim': rf10_external_internal_claim,
                'spf_failure': rf11_spf_failure,
                'dkim_failure': rf12_dkim_failure,
                'dmarc_failure': rf13_dmarc_failure,
                # Content (14-23)
                'sensitive_info_request': rf14_credential_request,
                'suspicious_attachments': rf15_suspicious_attachments,
                'attachment_types': attachment_types,
                'macro_request': rf16_macro_request,
                'shortened_urls': rf17_shortened_urls,
                'url_text_mismatch': rf18_url_mismatch,
                'grammar_issues': rf19_grammar_errors,
                'grammar_issue_count': grammar_count,
                'emotional_manipulation': rf20_emotional_manipulation,
                'unexpected_invoice': rf21_unexpected_invoice,
                'pressure_tactics': rf22_pressure_tactics,
                'pressure_phrases': pressure_phrases,
                'no_signature': rf23_no_signature,
                # Branding (24-28)
                'inconsistent_branding': rf24_inconsistent_branding,
                'qr_code': rf25_qr_code,
                'crypto_payment_request': rf26_crypto_payment,
                'unusual_formatting': rf27_unusual_formatting,
                'account_compromise_claim': rf28_account_compromise_claim,
                # Security (29-33)
                'bypass_security_request': rf29_bypass_security,
                'odd_hours': rf30_odd_hours,
                'unexpected_password_reset': rf31_unexpected_reset,
                'external_login_request': rf32_external_login,
                'unknown_sender': rf33_unknown_sender,
                # Other (34-40)
                'generic_greeting': rf34_generic_greeting,
                'generous_offer': rf35_generous_offer,
                'legal_threat': rf36_legal_threat,
                'non_corporate_pattern': rf37_non_corporate_pattern,
                'multiple_red_flags': rf38_multiple_red_flags,
                'urgency_detected': rf39_urgency,
                'urgency_phrases': urgency_phrases,
                'excessive_punctuation': rf40_excessive_punctuation
            },
            'green_flags': {
                'score': green_flag_score,
                # Domain Trust (1-5)
                'trusted_domain': gf1_official_domain,
                'domain': domain,
                'no_misspelled_domain': gf2_no_misspellings,
                'corporate_email': gf3_corporate_email,
                'consistent_sender': gf4_consistent_sender,
                'reply_to_matches': gf5_reply_to_matches,
                # Authentication (6-10)
                'good_reputation': gf6_good_domain_reputation,
                'valid_spf': gf7_valid_spf,
                'valid_dkim': gf8_valid_dkim,
                'valid_dmarc': gf9_valid_dmarc,
                'personalized_greeting': gf10_personalized_greeting,
                # Content Quality (11-15)
                'professional_language': gf11_professional_language,
                'no_urgency': gf12_no_urgency,
                'no_credential_request': gf13_no_credential_request,
                'official_links': gf14_official_links,
                'https_links': gf15_https_links,
                # Context (16-20)
                'expected_communication': gf16_expected_communication,
                'safe_attachments': gf17_safe_attachments,
                'clear_reason': gf18_clear_reason,
                'proper_grammar': gf19_proper_grammar,
                'professional_signature': gf20_professional_signature,
                # Branding (21-25)
                'consistent_branding': gf21_consistent_branding,
                'contact_details': gf22_contact_details,
                'unsubscribe_option': gf23_unsubscribe_option,
                'no_shortened_urls': gf24_no_shortened_urls,
                'link_preview_matches': gf25_link_preview_matches,
                # Security (26-30)
                'no_embedded_forms': gf26_no_embedded_forms,
                'known_pattern': gf27_known_pattern,
                'transactional_message': gf28_transactional,
                'official_support_address': gf29_official_support_address,
                'no_emotional_manipulation': gf30_no_emotional_manipulation,
                # Sender (31-35)
                'known_sender': gf31_known_sender,
                'business_hours': gf32_business_hours,
                'no_unusual_payment': gf33_no_unusual_payment,
                'no_qr_codes': gf34_no_qr_codes,
                'privacy_policy': gf35_privacy_policy,
                # Overall (36-40)
                'clear_cta': gf36_clear_call_to_action,
                'subject_content_match': gf37_subject_matches_content,
                'digitally_signed': gf38_digitally_signed,
                'low_risk_overall': gf39_low_risk_overall,
                'no_pressure': gf40_no_pressure
            },
            'content_analysis': {
                'urls_found': urls,
                'url_count': len(urls),
                'keywords_found': keywords,
                'high_priority_keywords': high_priority_keywords,
                'high_priority_count': len(high_priority_keywords),
                'greeting_type': greeting_type,
                'text_length': len(full_text),
                'word_count': len(full_text.split())
            },
            'overall_safety_score': green_flag_score - red_flag_score  # Range: -40 to +40
        }
    
    # ==================== Helper Functions for 40 Red/Green Flags ====================
    
    def _check_domain_misspelling(self, email):
        """Check for common domain misspellings (paypaI.com with capital i)"""
        if not email:
            return False
        email_lower = email.lower()
        # Common typosquatting patterns
        typos = ['paypa1.com', 'arnazon.com', 'amaz0n.com', 'microsofit.com', 'goog1e.com', 'app1e.com']
        return any(typo in email_lower for typo in typos)
    
    def _check_free_email_provider(self, email):
        """Check if using free email for official communication"""
        if not email:
            return False
        free_providers = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'mail.com', 'protonmail.com']
        return any(provider in email.lower() for provider in free_providers)
    
    def _check_random_email_pattern(self, email):
        """Check for random numbers/strings in email"""
        if not email:
            return False
        # Check for patterns like user12345@domain.com or abc123xyz@domain.com
        local_part = email.split('@')[0] if '@' in email else email
        # Count consecutive digits
        digit_sequences = re.findall(r'\d+', local_part)
        return any(len(seq) >= 4 for seq in digit_sequences)
    
    def _check_display_name_mismatch(self, display_name, email):
        """Check if display name impersonates brand but email doesn't match"""
        if not display_name or not email:
            return False
        brands = ['paypal', 'amazon', 'apple', 'microsoft', 'google', 'bank', 'security']
        display_lower = display_name.lower()
        email_lower = email.lower()
        for brand in brands:
            if brand in display_lower and brand not in email_lower:
                return True
        return False
    
    def _check_suspicious_tld(self, email):
        """Check for suspicious top-level domains"""
        if not email:
            return False
        suspicious_tlds = ['.xyz', '.top', '.tk', '.ml', '.ga', '.cf', '.gq', '.work', '.click']
        return any(tld in email.lower() for tld in suspicious_tlds)
    
    def _check_name_email_mismatch(self, display_name, email):
        """Check mismatch between sender name and email"""
        return self._check_display_name_mismatch(display_name, email)
    
    def _check_external_internal_mismatch(self, email, content):
        """Check if email claims to be internal but comes from external"""
        if not email or not content:
            return False
        internal_claims = ['internal', 'it department', 'hr department', 'admin team']
        content_lower = content.lower()
        email_lower = email.lower()
        # If content claims internal but email is not from company domain
        return any(claim in content_lower for claim in internal_claims) and '@' in email_lower
    
    def _check_macro_request(self, content):
        """Check for requests to enable macros"""
        if not content:
            return False
        macro_keywords = ['enable macro', 'enable content', 'enable editing', 'macros must be enabled']
        return any(keyword in content.lower() for keyword in macro_keywords)
    
    def _check_shortened_urls(self, content):
        """Check for shortened URLs"""
        if not content:
            return False
        shorteners = ['bit.ly', 'tinyurl', 'goo.gl', 't.co', 'ow.ly', 'is.gd', 'buff.ly', 'adf.ly']
        return any(shortener in content.lower() for shortener in shorteners)
    
    def _check_url_text_mismatch(self, content):
        """Check for mismatch between link text and actual URL"""
        # Look for HTML links like <a href="url">text</a>
        matches = re.findall(r'<a\s+href=["\']([^"\']+)["\']>([^<]+)</a>', content, re.IGNORECASE)
        for url, text in matches:
            # Extract domain from URL and check if it matches text
            url_domain = re.search(r'https?://([^/]+)', url)
            if url_domain and url_domain.group(1).lower() not in text.lower():
                return True
        return False
    
    def _check_emotional_manipulation(self, text):
        """Check for emotional manipulation tactics"""
        emotion_phrases = [
            'you\'ve won', 'congratulations', 'urgent', 'immediately', 'don\'t miss out',
            'limited time', 'act now', 'this is your last chance', 'exclusive offer',
            'you\'ve been selected', 'claim your prize', 'warning', 'alert', 'suspended'
        ]
        text_lower = text.lower()
        found = [phrase for phrase in emotion_phrases if phrase in text_lower]
        return len(found) >= 2, found
    
    def _check_unexpected_payment_request(self, content):
        """Check for unexpected invoices or payment requests"""
        payment_keywords = ['invoice', 'payment due', 'amount owed', 'pay now', 'billing', 'refund pending']
        return any(keyword in content.lower() for keyword in payment_keywords)
    
    def _check_missing_signature(self, content):
        """Check for missing professional signature"""
        signature_indicators = ['regards', 'sincerely', 'best', 'thank you', 'thanks', 'team']
        content_lower = content.lower()
        # If email has no signature indicators, likely suspicious
        return not any(indicator in content_lower for indicator in signature_indicators)
    
    def _check_qr_code_mention(self, content):
        """Check for QR code mentions"""
        qr_keywords = ['qr code', 'scan code', 'scan to', 'qr', 'barcode']
        return any(keyword in content.lower() for keyword in qr_keywords)
    
    def _check_crypto_payment_request(self, content):
        """Check for cryptocurrency payment requests"""
        crypto_keywords = ['bitcoin', 'btc', 'ethereum', 'eth', 'cryptocurrency', 'crypto wallet', 'gift card']
        return any(keyword in content.lower() for keyword in crypto_keywords)
    
    def _check_unusual_formatting(self, text):
        """Check for unusual capitalization or formatting"""
        # Excessive caps, mixed case, unusual spacing
        caps_count = sum(1 for c in text if c.isupper())
        if len(text) > 0 and caps_count / len(text) > 0.3:
            return True
        # Check for unusual spacing
        if re.search(r'\s{5,}', text):
            return True
        return False
    
    def _check_compromise_claim(self, content):
        """Check for claims of account compromise"""
        compromise_keywords = ['compromised', 'hacked', 'unauthorized access', 'suspicious activity', 'unusual activity']
        return any(keyword in content.lower() for keyword in compromise_keywords)
    
    def _check_bypass_security_request(self, content):
        """Check for requests to bypass security"""
        bypass_keywords = ['disable antivirus', 'turn off firewall', 'bypass security', 'ignore warning']
        return any(keyword in content.lower() for keyword in bypass_keywords)
    
    def _check_unexpected_password_reset(self, content):
        """Check for unexpected password reset notifications"""
        reset_keywords = ['password reset', 'password change', 'reset your password', 'change your password']
        return any(keyword in content.lower() for keyword in reset_keywords)
    
    def _check_external_login_request(self, content):
        """Check for external login requests"""
        login_keywords = ['click here to login', 'log in now', 'sign in here', 'verify your account']
        return any(keyword in content.lower() for keyword in login_keywords)
    
    def _check_known_sender(self, email):
        """Check if sender is from known/trusted domain"""
        is_trusted, _ = self.check_trusted_domain(email)
        return is_trusted
    
    def _check_too_good_offer(self, content):
        """Check for overly generous offers"""
        offer_keywords = ['free iphone', 'free gift card', '$1000', '$500 gift', 'you\'ve won', 'lottery winner']
        return any(keyword in content.lower() for keyword in offer_keywords)
    
    def _check_legal_threat(self, content):
        """Check for fake legal warnings"""
        legal_keywords = ['legal action', 'lawsuit', 'court', 'attorney', 'subpoena', 'warrant']
        return any(keyword in content.lower() for keyword in legal_keywords)
    
    def _check_non_corporate_email(self, email):
        """Check for non-corporate email patterns"""
        if not email:
            return True
        # Check if it's a free provider (non-corporate for business)
        return self._check_free_email_provider(email)
    
    def _check_excessive_punctuation(self, text):
        """Check for excessive punctuation"""
        # Count exclamation marks and question marks
        exclamations = text.count('!')
        questions = text.count('?')
        if len(text) > 0:
            punct_ratio = (exclamations + questions) / len(text)
            return punct_ratio > 0.05 or exclamations >= 3
        return False
    
    def _check_all_https(self, urls):
        """Check if all URLs use HTTPS"""
        if not urls:
            return True  # No URLs = safe
        return all(url.startswith('https://') for url in urls)
    
    def _check_clear_purpose(self, content):
        """Check if email has clear purpose"""
        # Simple heuristic: longer emails with clear structure likely have clear purpose
        if len(content) < 50:
            return False
        # Check for common structural elements
        structure_indicators = ['order', 'confirmation', 'receipt', 'notification', 'update', 'information']
        return any(indicator in content.lower() for indicator in structure_indicators)
    
    def _check_contact_details_present(self, content):
        """Check for presence of contact details"""
        contact_patterns = [
            r'\d{3}[-.]?\d{3}[-.]?\d{4}',  # Phone number
            r'contact us',
            r'support@',
            r'help@',
            r'customer service'
        ]
        return any(re.search(pattern, content, re.IGNORECASE) for pattern in contact_patterns)
    
    def _check_unsubscribe_option(self, content):
        """Check for unsubscribe option"""
        unsubscribe_keywords = ['unsubscribe', 'opt out', 'manage preferences', 'email preferences']
        return any(keyword in content.lower() for keyword in unsubscribe_keywords)
    
    def _check_embedded_form(self, content):
        """Check for embedded credential collection forms"""
        form_indicators = ['<form', '<input', 'type="password"', 'enter your password', 'type your password']
        return any(indicator in content.lower() for indicator in form_indicators)
    
    def _check_known_communication_pattern(self, content, is_trusted_domain):
        """Check if follows known communication patterns"""
        if not is_trusted_domain:
            return False
        # Trusted domains with transactional patterns
        transactional_indicators = ['order', 'confirmation', 'receipt', 'shipped', 'delivered']
        return any(indicator in content.lower() for indicator in transactional_indicators)
    
    def _check_transactional_message(self, content):
        """Check if message is transactional"""
        transactional_keywords = ['order', 'receipt', 'confirmation', 'invoice', 'shipped', 'tracking', 'delivered']
        return any(keyword in content.lower() for keyword in transactional_keywords)
    
    def _check_official_support_address(self, email):
        """Check for official support addresses"""
        if not email:
            return False
        official_patterns = ['noreply@', 'no-reply@', 'support@', 'info@', 'notifications@', 'alerts@']
        return any(pattern in email.lower() for pattern in official_patterns)
    
    def _check_privacy_policy(self, content):
        """Check for privacy policy mention"""
        privacy_keywords = ['privacy policy', 'terms of service', 'terms and conditions', 'legal notice']
        return any(keyword in content.lower() for keyword in privacy_keywords)
    
    def _check_clear_cta(self, content):
        """Check for clear call-to-action without pressure"""
        cta_keywords = ['view order', 'track package', 'manage account', 'review', 'learn more']
        pressure_keywords = ['urgent', 'immediately', 'act now', 'limited time']
        has_cta = any(keyword in content.lower() for keyword in cta_keywords)
        has_pressure = any(keyword in content.lower() for keyword in pressure_keywords)
        return has_cta and not has_pressure
    
    def _check_subject_content_match(self, subject, content):
        """Check if subject matches content"""
        if not subject or not content:
            return False
        subject_lower = subject.lower()
        content_lower = content.lower()
        # Extract key words from subject
        subject_words = set(re.findall(r'\b\w{4,}\b', subject_lower))
        # Check if at least 50% of subject words appear in content
        matches = sum(1 for word in subject_words if word in content_lower)
        return len(subject_words) > 0 and matches / len(subject_words) >= 0.5


if __name__ == "__main__":
    # Test the preprocessor
    download_nltk_data()
    
    preprocessor = TextPreprocessor()
    
    test_text = "URGENT! Your account has been SUSPENDED. Click here to verify: http://fake-site.com"
    print("Original:", test_text)
    print("Cleaned:", preprocessor.preprocess(test_text))
    print("Stats:", preprocessor.get_text_statistics(test_text))
