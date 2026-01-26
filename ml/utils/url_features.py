"""
URL feature extraction utilities for PhishGuard
Complete 40 RED FLAGS + 40 GREEN FLAGS implementation
"""
import re
from urllib.parse import urlparse
import string

class URLFeatureExtractor:
    """Extract features from URLs for phishing detection with 40+40 comprehensive flags"""
    
    def __init__(self):
        """Initialize URL feature extractor"""
        # Trusted domains for green flags
        self.trusted_domains = [
            'google.com', 'youtube.com', 'facebook.com', 'amazon.com', 'amazon.in',
            'wikipedia.org', 'twitter.com', 'instagram.com', 'linkedin.com',
            'microsoft.com', 'apple.com', 'github.com', 'stackoverflow.com',
            'icicibank.com', 'hdfcbank.com', 'sbi.co.in', 'kotak.com',
            'paypal.com', 'netflix.com', 'ebay.com', 'flipkart.com'
        ]
        
        # Brand names for typosquatting detection
        self.brand_names = [
            'paypal', 'amazon', 'google', 'microsoft', 'apple', 'facebook',
            'netflix', 'ebay', 'instagram', 'twitter', 'linkedin', 'github',
            'bank', 'secure', 'login', 'teams', 'outlook', 'office', 'onedrive',
            'sharepoint', 'adobe', 'dropbox', 'zoom', 'slack', 'discord',
            'spotify', 'steam', 'payoneer', 'stripe', 'venmo', 'chase', 'wellsfargo'
        ]
        
        # URL shortener domains
        self.url_shorteners = [
            'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd',
            'buff.ly', 'adf.ly', 'bl.ink', 'lnkd.in', 'short.link'
        ]
        
        # Suspicious keywords
        self.suspicious_words = [
            'login', 'signin', 'verify', 'account', 'update', 'secure',
            'banking', 'confirm', 'suspend', 'restricted', 'reset', 'prize',
            'winner', 'claim', 'reward', 'free', 'urgent'
        ]
        
        # Typosquatting patterns
        self.typosquatting_patterns = [
            ('paypal', ['paypa1', 'paypa11', 'paipal', 'paypaI', 'paypa']),
            ('amazon', ['arnazon', 'amazom', 'amaz0n', 'amazonn', 'amozon', 'arnaz']),
            ('google', ['gooogle', 'googie', 'goog1e', 'googgle', 'gogle', 'goog']),
            ('microsoft', ['microsft', 'micros0ft', 'micro-soft', 'microsooft']),
            ('facebook', ['faceb00k', 'facebok', 'faceboook', 'fecebook'])
        ]
    
    def extract_domain(self, url):
        """Extract domain from URL"""
        try:
            if not url.startswith(('http://', 'https://')):
                url = 'http://' + url
            parsed = urlparse(url)
            return parsed.netloc
        except:
            return ""
    
    def has_ip_address(self, url):
        """Check if URL uses IP address instead of domain"""
        domain = self.extract_domain(url)
        if not domain:
            return 0
        # IPv4 pattern
        ipv4_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
        if re.match(ipv4_pattern, domain):
            return 1
        # IPv6 in brackets
        if '[' in domain and ']' in domain:
            return 1
        return 0
    
    def is_https(self, url):
        """Check if URL uses HTTPS"""
        return 1 if url.startswith('https://') else 0
    
    def has_typosquatting(self, url):
        """Detect typosquatting in domain"""
        domain = self.extract_domain(url).lower()
        
        # Check typosquatting patterns
        for brand, variations in self.typosquatting_patterns:
            if any(var in domain for var in variations):
                return 1
        
        # Check for digit substitutions in brand names
        for brand in self.brand_names:
            if brand in domain:
                # Check for common substitutions: o->0, i->1, e->3, a->4
                suspicious_chars = re.findall(r'[0-9]', domain)
                if len(suspicious_chars) > 0 and brand in domain:
                    return 1
        
        return 0
    
    def is_url_shortener(self, url):
        """Check if URL is a shortener"""
        domain = self.extract_domain(url).lower()
        return 1 if any(shortener in domain for shortener in self.url_shorteners) else 0
    
    def has_excessive_subdomains(self, url):
        """Check for excessive subdomains"""
        domain = self.extract_domain(url)
        if not domain:
            return 0
        subdomain_count = domain.count('.')
        return 1 if subdomain_count > 3 else 0
    
    def has_brand_mismatch(self, url):
        """Check if brand name in URL doesn't match domain"""
        domain = self.extract_domain(url).lower()
        url_lower = url.lower()
        
        for brand in self.brand_names:
            if brand in url_lower and brand not in domain.split('.')[-2:]:
                return 1
        return 0
    
    def has_suspicious_words(self, url):
        """Count suspicious words in URL"""
        url_lower = url.lower()
        count = sum(1 for word in self.suspicious_words if word in url_lower)
        return count
    
    def is_long_url(self, url):
        """Check if URL is unusually long"""
        return 1 if len(url) > 75 else 0
    
    def has_port(self, url):
        """Check for non-standard port"""
        parsed = urlparse(url)
        return 1 if parsed.port is not None else 0
    
    def is_trusted_domain(self, url):
        """Check if domain is trusted"""
        domain = self.extract_domain(url).lower()
        return any(trusted in domain for trusted in self.trusted_domains)
    
    def extract_all_features(self, url):
        """Extract all ML features as dictionary"""
        if not isinstance(url, str):
            url = str(url)
        
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        try:
            parsed = urlparse(url)
            domain = parsed.netloc
            path = parsed.path
        except:
            domain = ""
            path = ""
        
        features = {
            'url_length': len(url),
            'domain_length': len(domain),
            'path_length': len(path),
            'has_ip': self.has_ip_address(url),
            'is_https': self.is_https(url),
            'has_typosquatting': self.has_typosquatting(url),
            'is_url_shortener': self.is_url_shortener(url),
            'subdomain_count': domain.count('.'),
            'has_excessive_subdomains': self.has_excessive_subdomains(url),
            'has_brand_mismatch': self.has_brand_mismatch(url),
            'suspicious_word_count': self.has_suspicious_words(url),
            'is_long_url': self.is_long_url(url),
            'has_port': self.has_port(url),
            'is_trusted': 1 if self.is_trusted_domain(url) else 0,
            'hyphen_count': domain.count('-'),
            'digit_count': sum(c.isdigit() for c in domain),
            'at_symbol': 1 if '@' in url else 0,
            'double_slash_redirect': 1 if '//' in url.split('://', 1)[-1] else 0,
            'encoded_chars': 1 if re.search(r'%[0-9A-Fa-f]{2}', url) else 0,
            'query_length': len(parsed.query) if parsed.query else 0,
            'fragment_length': len(parsed.fragment) if parsed.fragment else 0,
            'tld_length': len(domain.split('.')[-1]) if '.' in domain else 0,
            'special_char_count': sum(1 for c in url if c in '!@#$%^&*()+=[]{}|;:,<>?')
        }
        
        return features
    
    def extract_feature_vector(self, url):
        """Extract feature vector as list for ML models"""
        features = self.extract_all_features(url)
        return list(features.values())
    
    def analyze_url_comprehensively(self, url):
        """
        Comprehensive URL analysis with 40 RED FLAGS and 40 GREEN FLAGS
        Returns detailed analysis with all flag states
        """
        if not isinstance(url, str):
            url = str(url)
        
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        try:
            parsed = urlparse(url)
            domain = parsed.netloc
            path = parsed.path
            query = parsed.query
            scheme = parsed.scheme
        except:
            domain = ""
            path = ""
            query = ""
            scheme = "http"
        
        url_lower = url.lower()
        domain_lower = domain.lower() if domain else ""
        
        # ===== 40 RED FLAGS =====
        
        # RF #1: IP address instead of domain
        rf1_uses_ip = self.has_ip_address(url) == 1
        
        # RF #2: Typosquatting (misspelled brands)
        rf2_typosquatting = self.has_typosquatting(url) == 1
        
        # RF #3: Excessive subdomains (>3)
        rf3_excessive_subdomains = self.has_excessive_subdomains(url) == 1
        
        # RF #4: Unusually long URL (>75 chars)
        rf4_long_url = len(url) > 75
        
        # RF #5: URL shorteners
        rf5_url_shortener = self.is_url_shortener(url) == 1
        
        # RF #6: Recently registered/unknown domain
        rf6_unknown_domain = not self.is_trusted_domain(url)
        
        # Define impersonation brands list first (used in multiple flags)
        impersonation_brands = [
            'paypal', 'amazon', 'google', 'microsoft', 'apple', 'facebook',
            'teams', 'outlook', 'office', 'onedrive', 'sharepoint', 'netflix',
            'instagram', 'linkedin', 'twitter', 'github', 'adobe', 'dropbox',
            'zoom', 'slack', 'discord', 'spotify', 'steam', 'bank', 'chase',
            'fedex', 'ups', 'usps', 'dhl', 'delivery', 'track', 'parcel', 'package',
            'shipment', 'courier', 'post', 'shipping', 'logistics',
            # Government and authority keywords
            'government', 'gov', 'official', 'ministry', 'department', 'pm', 'relief',
            'benefit', 'scheme', 'welfare', 'subsidy', 'grant', 'tax', 'income',
            'irs', 'sbi', 'pnb', 'hdfc', 'icici', 'axis', 'kotak',
            # Financial keywords
            'kyc', 'verify', 'account', 'update', 'claim', 'refund', 'reward',
            'cashback', 'lottery', 'winner', 'prize'
        ]
        
        # RF #7: Excessive hyphens in domain (>1 is suspicious, especially with brand names)
        hyphen_count = domain.count('-')
        # If domain has brand name and hyphens, it's likely phishing (e.g., teams-docs-access, track-myparcel)
        # Also flag delivery-related terms with hyphens
        delivery_keywords = ['track', 'parcel', 'package', 'delivery', 'shipment', 'courier', 'fedex', 'ups', 'dhl', 'usps',
                           'pm', 'gov', 'relief', 'benefit', 'scheme', 'tax', 'kyc', 'verify', 'claim', 'refund']
        has_brand_with_hyphens = hyphen_count > 0 and any(brand in domain_lower for brand in impersonation_brands)
        has_delivery_with_hyphens = hyphen_count > 0 and any(keyword in domain_lower for keyword in delivery_keywords)
        rf7_excessive_hyphens = hyphen_count > 2 or has_brand_with_hyphens or has_delivery_with_hyphens
        
        # RF #8: Random characters in domain (long sequences)
        rf8_random_chars = bool(re.search(r'[a-z0-9]{12,}', domain_lower))
        
        # RF #9: Suspicious TLD
        suspicious_tlds = ['.xyz', '.top', '.click', '.tk', '.ml', '.ga', '.cf', '.gq', '.club', 
                          '.online', '.work', '.link', '.download', '.stream', '.review', '.racing',
                          '.loan', '.bid', '.win', '.party', '.trade', '.science', '.date', '.in',
                          '.ru', '.cn', '.pw', '.cc']
        rf9_suspicious_tld = any(domain_lower.endswith(tld) for tld in suspicious_tlds)
        
        # RF #10: Domain name doesn't match brand
        rf10_brand_mismatch = self.has_brand_mismatch(url) == 1
        
        # RF #11: Encoded characters (%20, etc.)
        rf11_encoded_chars = bool(re.search(r'%[0-9A-Fa-f]{2}', url))
        
        # RF #12: HTTP instead of HTTPS
        rf12_uses_http = scheme == 'http'
        
        # RF #13: Suspicious keywords in domain
        rf13_suspicious_domain_words = any(word in domain_lower for word in ['secure', 'login', 'verify', 'account', 'bank'])
        
        # RF #14: Excessive query parameters (>5)
        rf14_excessive_params = url.count('&') > 5 or url.count('=') > 5
        
        # RF #15: @ symbol in URL
        rf15_at_symbol = '@' in url
        
        # RF #16: Redirect keywords in URL
        rf16_redirect_keywords = any(kw in url_lower for kw in ['redirect', 'redir', 'goto', 'link='])
        
        # RF #17: URL contains another URL
        rf17_url_in_params = bool(re.search(r'[?&](url|link|goto)=https?://', url_lower))
        
        # RF #18: Suspicious fragment (>#)
        rf18_suspicious_fragment = '#' in url and len(url.split('#')[1]) > 20
        
        # RF #19: Suspicious keywords in path
        path_keywords = ['login', 'verify', 'update', 'confirm', 'secure', 'account']
        rf19_suspicious_path = any(kw in path.lower() for kw in path_keywords)
        
        # RF #20: Download keywords
        rf20_download_keywords = 'download' in url_lower or any(ext in url_lower for ext in ['.exe', '.scr', '.bat'])
        
        # RF #21: Prize/reward keywords
        rf21_prize_keywords = any(kw in url_lower for kw in ['prize', 'winner', 'reward', 'claim', 'free', 'gift'])
        
        # RF #22: Urgency keywords
        rf22_urgency = any(kw in url_lower for kw in ['urgent', 'immediately', 'now', 'expire', 'limited'])
        
        # RF #23: Login page mimicry
        rf23_login_mimicry = '/login' in path.lower() or '/signin' in path.lower()
        
        # RF #24: Double file extensions
        rf24_double_extension = bool(re.search(r'\.(pdf|doc|jpg)\.(exe|scr|bat)', url_lower))
        
        # RF #25: Unicode/punycode
        rf25_punycode = 'xn--' in domain_lower
        
        # RF #26: Mismatched display text (cannot check in URL alone)
        rf26_link_mismatch = False
        
        # RF #27: Free hosting services
        free_hosts = ['000webhostapp', 'wixsite', 'weebly', 'blogspot']
        rf27_free_hosting = any(host in domain_lower for host in free_hosts)
        
        # RF #28: No HTTPS certificate (checking HTTPS only)
        rf28_no_https = scheme != 'https'
        
        # RF #29: Credential request keywords
        rf29_credential_keywords = any(kw in url_lower for kw in ['password', 'credential', 'ssn', 'card'])
        
        # RF #30: Non-standard port
        rf30_nonstandard_port = self.has_port(url) == 1
        
        # RF #31: Excessive slashes (>7)
        rf31_excessive_slashes = url.count('/') > 7
        
        # RF #32: Suspicious digit-letter mix
        rf32_digit_letter_mix = bool(re.search(r'[a-z]+[0-9]+[a-z]+', domain_lower))
        
        # RF #33: Multiple dots in succession
        rf33_multiple_dots = '..' in domain
        
        # RF #34: Tracking parameters
        rf34_tracking = any(param in query.lower() for param in ['utm_', 'track', 'ref=', 'source='])
        
        # RF #35: JavaScript/data URL
        rf35_javascript_data = url_lower.startswith(('javascript:', 'data:'))
        
        # RF #36: Missing common TLD
        common_tlds = ['.com', '.org', '.edu', '.gov', '.net', '.in', '.co', '.io']
        rf36_uncommon_tld = not any(domain_lower.endswith(tld) for tld in common_tlds) if domain else False
        
        # RF #37: Brand impersonation
        # Check for brand names in domain (including hyphen-separated like "teams-docs")
        rf37_impersonation = False
        for brand in impersonation_brands:
            # Check exact match or hyphen-separated (teams-docs, paypal-verify, etc.)
            if brand in domain_lower and not self.is_trusted_domain(url):
                rf37_impersonation = True
                break
        
        # RF #38: Token/session in URL
        rf38_tokens = any(kw in query.lower() for kw in ['token=', 'session=', 'key='])
        
        # RF #39: IP in domain string
        rf39_ip_string = bool(re.search(r'\d{1,3}-\d{1,3}-\d{1,3}-\d{1,3}', domain))
        
        # RF #40: Suspicious TLD + suspicious keyword combination
        rf40_tld_keyword_combo = rf9_suspicious_tld and (rf21_prize_keywords or rf19_suspicious_path)
        
        # ===== 40 GREEN FLAGS =====
        
        # GF #1: Uses HTTPS
        gf1_uses_https = scheme == 'https'
        
        # GF #2: Well-established domain
        gf2_established = self.is_trusted_domain(url)
        
        # GF #3: Domain clearly readable
        gf3_readable = not rf8_random_chars and not rf2_typosquatting
        
        # GF #4: Reasonable URL length (<75)
        gf4_reasonable_length = len(url) < 75
        
        # GF #5: No unnecessary subdomains (<=3 dots)
        gf5_clean_subdomains = domain.count('.') <= 3
        
        # GF #6: Domain matches expected brand
        gf6_brand_match = not rf10_brand_mismatch and gf2_established
        
        # GF #7: Reputable TLD
        reputable_tlds = ['.com', '.org', '.edu', '.gov', '.net', '.in', '.co.uk']
        gf7_reputable_tld = any(domain_lower.endswith(tld) for tld in reputable_tlds)
        
        # GF #8: No misspellings
        gf8_no_misspelling = not rf2_typosquatting
        
        # GF #9: Clean URL structure
        gf9_clean_structure = not rf11_encoded_chars and not rf31_excessive_slashes
        
        # GF #10: Minimal query parameters (<=3)
        gf10_minimal_params = url.count('&') <= 3
        
        # GF #11: No obfuscation
        gf11_no_obfuscation = not rf11_encoded_chars and not rf35_javascript_data
        
        # GF #12: No unexpected redirects
        gf12_no_redirects = not rf16_redirect_keywords and not rf17_url_in_params
        
        # GF #13: Domain consistent
        gf13_domain_consistent = not rf17_url_in_params
        
        # GF #14: Good domain reputation
        gf14_good_reputation = gf2_established
        
        # GF #15: Common TLD
        gf15_common_tld = not rf36_uncommon_tld
        
        # GF #16: No suspicious keywords
        gf16_no_suspicious_keywords = not rf19_suspicious_path and not rf21_prize_keywords
        
        # GF #17: No data requests
        gf17_no_data_request = not rf29_credential_keywords
        
        # GF #18: No forced downloads
        gf18_no_downloads = not rf20_download_keywords
        
        # GF #19: Standard ports
        gf19_standard_ports = not rf30_nonstandard_port
        
        # GF #20: Uses domain name (not IP)
        gf20_uses_domain = not rf1_uses_ip
        
        # GF #21: Established domain (trusted)
        gf21_longterm = gf2_established
        
        # GF #22: HTTPS with trusted domain
        gf22_https_trusted = gf1_uses_https and gf2_established
        
        # GF #23: No URL shortener
        gf23_no_shortener = not rf5_url_shortener
        
        # GF #24: Normal domain structure (no excessive hyphens)
        gf24_normal_structure = domain.count('-') <= 2
        
        # GF #25: No @ symbol
        gf25_no_at_symbol = not rf15_at_symbol
        
        # GF #26: No punycode
        gf26_no_punycode = not rf25_punycode
        
        # GF #27: Short domain name (<30 chars)
        gf27_short_domain = len(domain) < 30
        
        # GF #28: Logical path structure (<50 chars)
        gf28_logical_path = len(path) < 50
        
        # GF #29: No excessive dots
        gf29_no_excessive_dots = not rf33_multiple_dots
        
        # GF #30: Clean domain (alphanumeric + dots/hyphens only)
        gf30_clean_domain = bool(re.match(r'^[a-z0-9\.\-]+$', domain_lower)) if domain else False
        
        # GF #31: No impersonation
        gf31_no_impersonation = not rf37_impersonation
        
        # GF #32: No urgency tactics
        gf32_no_urgency = not rf22_urgency
        
        # GF #33: Professional appearance
        gf33_professional = gf2_established and gf1_uses_https and not rf21_prize_keywords
        
        # GF #34: No hidden parameters (tokens/sessions)
        gf34_no_hidden_params = not rf38_tokens
        
        # GF #35: Domain length reasonable (10-30 chars)
        gf35_reasonable_domain = 10 <= len(domain) <= 30
        
        # GF #36: No brand mismatch
        gf36_brand_consistent = not rf10_brand_mismatch
        
        # GF #37: Clear purpose (no suspicious paths)
        gf37_clear_purpose = not rf19_suspicious_path
        
        # GF #38: No free hosting
        gf38_no_free_hosting = not rf27_free_hosting
        
        # GF #39: Standard URL format
        gf39_standard_format = gf1_uses_https and not rf15_at_symbol and not rf31_excessive_slashes
        
        # GF #40: No suspicious combinations
        gf40_no_combinations = not rf40_tld_keyword_combo
        
        # Calculate scores
        red_flag_list = [
            rf1_uses_ip, rf2_typosquatting, rf3_excessive_subdomains, rf4_long_url, rf5_url_shortener,
            rf6_unknown_domain, rf7_excessive_hyphens, rf8_random_chars, rf9_suspicious_tld, rf10_brand_mismatch,
            rf11_encoded_chars, rf12_uses_http, rf13_suspicious_domain_words, rf14_excessive_params, rf15_at_symbol,
            rf16_redirect_keywords, rf17_url_in_params, rf18_suspicious_fragment, rf19_suspicious_path, rf20_download_keywords,
            rf21_prize_keywords, rf22_urgency, rf23_login_mimicry, rf24_double_extension, rf25_punycode,
            rf26_link_mismatch, rf27_free_hosting, rf28_no_https, rf29_credential_keywords, rf30_nonstandard_port,
            rf31_excessive_slashes, rf32_digit_letter_mix, rf33_multiple_dots, rf34_tracking, rf35_javascript_data,
            rf36_uncommon_tld, rf37_impersonation, rf38_tokens, rf39_ip_string, rf40_tld_keyword_combo
        ]
        
        green_flag_list = [
            gf1_uses_https, gf2_established, gf3_readable, gf4_reasonable_length, gf5_clean_subdomains,
            gf6_brand_match, gf7_reputable_tld, gf8_no_misspelling, gf9_clean_structure, gf10_minimal_params,
            gf11_no_obfuscation, gf12_no_redirects, gf13_domain_consistent, gf14_good_reputation, gf15_common_tld,
            gf16_no_suspicious_keywords, gf17_no_data_request, gf18_no_downloads, gf19_standard_ports, gf20_uses_domain,
            gf21_longterm, gf22_https_trusted, gf23_no_shortener, gf24_normal_structure, gf25_no_at_symbol,
            gf26_no_punycode, gf27_short_domain, gf28_logical_path, gf29_no_excessive_dots, gf30_clean_domain,
            gf31_no_impersonation, gf32_no_urgency, gf33_professional, gf34_no_hidden_params, gf35_reasonable_domain,
            gf36_brand_consistent, gf37_clear_purpose, gf38_no_free_hosting, gf39_standard_format, gf40_no_combinations
        ]
        
        red_flag_score = sum(red_flag_list)
        green_flag_score = sum(green_flag_list)
        
        # Detailed flag dictionaries
        red_flags_dict = {
            'uses_ip_address': rf1_uses_ip,
            'typosquatting': rf2_typosquatting,
            'excessive_subdomains': rf3_excessive_subdomains,
            'long_url': rf4_long_url,
            'url_shortener': rf5_url_shortener,
            'unknown_domain': rf6_unknown_domain,
            'excessive_hyphens': rf7_excessive_hyphens,
            'random_characters': rf8_random_chars,
            'suspicious_tld': rf9_suspicious_tld,
            'brand_mismatch': rf10_brand_mismatch,
            'encoded_characters': rf11_encoded_chars,
            'uses_http': rf12_uses_http,
            'suspicious_domain_words': rf13_suspicious_domain_words,
            'excessive_params': rf14_excessive_params,
            'at_symbol': rf15_at_symbol,
            'redirect_keywords': rf16_redirect_keywords,
            'url_in_params': rf17_url_in_params,
            'suspicious_fragment': rf18_suspicious_fragment,
            'suspicious_path': rf19_suspicious_path,
            'download_keywords': rf20_download_keywords,
            'prize_keywords': rf21_prize_keywords,
            'urgency': rf22_urgency,
            'login_mimicry': rf23_login_mimicry,
            'double_extension': rf24_double_extension,
            'punycode': rf25_punycode,
            'link_mismatch': rf26_link_mismatch,
            'free_hosting': rf27_free_hosting,
            'no_https': rf28_no_https,
            'credential_keywords': rf29_credential_keywords,
            'nonstandard_port': rf30_nonstandard_port,
            'excessive_slashes': rf31_excessive_slashes,
            'digit_letter_mix': rf32_digit_letter_mix,
            'multiple_dots': rf33_multiple_dots,
            'tracking': rf34_tracking,
            'javascript_data': rf35_javascript_data,
            'uncommon_tld': rf36_uncommon_tld,
            'impersonation': rf37_impersonation,
            'tokens': rf38_tokens,
            'ip_string': rf39_ip_string,
            'tld_keyword_combo': rf40_tld_keyword_combo
        }
        
        green_flags_dict = {
            'uses_https': gf1_uses_https,
            'established_domain': gf2_established,
            'readable_domain': gf3_readable,
            'reasonable_length': gf4_reasonable_length,
            'clean_subdomains': gf5_clean_subdomains,
            'brand_match': gf6_brand_match,
            'reputable_tld': gf7_reputable_tld,
            'no_misspelling': gf8_no_misspelling,
            'clean_structure': gf9_clean_structure,
            'minimal_params': gf10_minimal_params,
            'no_obfuscation': gf11_no_obfuscation,
            'no_redirects': gf12_no_redirects,
            'domain_consistent': gf13_domain_consistent,
            'good_reputation': gf14_good_reputation,
            'common_tld': gf15_common_tld,
            'no_suspicious_keywords': gf16_no_suspicious_keywords,
            'no_data_request': gf17_no_data_request,
            'no_downloads': gf18_no_downloads,
            'standard_ports': gf19_standard_ports,
            'uses_domain': gf20_uses_domain,
            'longterm_domain': gf21_longterm,
            'https_trusted': gf22_https_trusted,
            'no_shortener': gf23_no_shortener,
            'normal_structure': gf24_normal_structure,
            'no_at_symbol': gf25_no_at_symbol,
            'no_punycode': gf26_no_punycode,
            'short_domain': gf27_short_domain,
            'logical_path': gf28_logical_path,
            'no_excessive_dots': gf29_no_excessive_dots,
            'clean_domain': gf30_clean_domain,
            'no_impersonation': gf31_no_impersonation,
            'no_urgency': gf32_no_urgency,
            'professional': gf33_professional,
            'no_hidden_params': gf34_no_hidden_params,
            'reasonable_domain_length': gf35_reasonable_domain,
            'brand_consistent': gf36_brand_consistent,
            'clear_purpose': gf37_clear_purpose,
            'no_free_hosting': gf38_no_free_hosting,
            'standard_format': gf39_standard_format,
            'no_suspicious_combinations': gf40_no_combinations
        }
        
        # Generate human-readable lists
        red_flags_list = [k.replace('_', ' ').title() for k, v in red_flags_dict.items() if v]
        green_flags_list = [k.replace('_', ' ').title() for k, v in green_flags_dict.items() if v]
        
        return {
            'url': url,
            'domain': domain,
            'red_flags': red_flags_dict,
            'red_flag_count': red_flag_score,
            'red_flags_list': red_flags_list,
            'green_flags': green_flags_dict,
            'green_flag_count': green_flag_score,
            'green_flags_list': green_flags_list,
            'risk_score': min(100, red_flag_score * 5),  # Each red flag = 5% risk (max 100%)
            'safety_score': min(100, green_flag_score * 5),  # Each green flag = 5% safety
            'features': self.extract_all_features(url)
        }


if __name__ == "__main__":
    # Test the feature extractor
    extractor = URLFeatureExtractor()
    
    test_urls = [
        "https://www.google.com",
        "http://192.168.1.1/login",
        "http://amaz0n-prize-winner.xyz/claim-now",
        "https://github.com/settings/security"
    ]
    
    for url in test_urls:
        print(f"\n{'='*60}")
        print(f"URL: {url}")
        result = extractor.analyze_url_comprehensively(url)
        print(f"Red Flags: {result['red_flag_count']}/40")
        print(f"Green Flags: {result['green_flag_count']}/40")
        print(f"Risk Score: {result['risk_score']}%")
