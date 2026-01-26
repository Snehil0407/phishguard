"""
URL feature extraction utilities for PhishGuard
Enhanced with comprehensive RED FLAGS and GREEN FLAGS
"""
import re
from urllib.parse import urlparse
import string
from datetime import datetime

class URLFeatureExtractor:
    """Extract features from URLs for phishing detection"""
    
    def __init__(self):
        """Initialize URL feature extractor"""
        # RED FLAG: Suspicious keywords in URL
        self.suspicious_words = [
            'login', 'signin', 'verify', 'account', 'update', 'secure',
            'banking', 'confirm', 'suspend', 'restricted', 'reset', 'kyc',
            'webscr', 'cmd', 'ebayisapi', 'validation', 'authentication'
        ]
        
        # GREEN FLAG: Official and well-known domains
        self.trusted_domains = [
            'google.com', 'youtube.com', 'facebook.com', 'amazon.com', 'amazon.in',
            'wikipedia.org', 'twitter.com', 'instagram.com', 'linkedin.com',
            'microsoft.com', 'apple.com', 'github.com', 'stackoverflow.com',
            'icicibank.com', 'hdfcbank.com', 'sbi.co.in', 'kotak.com',
            'paypal.com', 'netflix.com', 'ebay.com', 'flipkart.com'
        ]
        
        # RED FLAG: Common brand names for typosquatting detection
        self.brand_names = [
            'paypal', 'amazon', 'google', 'microsoft', 'apple', 'facebook',
            'netflix', 'ebay', 'instagram', 'twitter', 'linkedin', 'github',
            'icici', 'hdfc', 'sbi', 'axis', 'kotak', 'bank', 'flipkart'
        ]
        
        # RED FLAG: URL shortener domains
        self.url_shorteners = [
            'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd',
            'buff.ly', 'adf.ly', 'bl.ink', 'lnkd.in', 'short.link'
        ]
        
        # RED FLAG: Common typosquatting patterns for popular brands
        self.typosquatting_patterns = [
            ('paypal', ['paypa1', 'paypai', 'paypa11', 'paipal', 'paypaI']),
            ('amazon', ['arnazon', 'amazom', 'amaz0n', 'amazonn', 'amozon']),
            ('google', ['gooogle', 'googie', 'goog1e', 'googgle', 'gogle']),
            ('microsoft', ['microsft', 'micros0ft', 'micro-soft', 'microsooft']),
            ('facebook', ['faceb00k', 'facebok', 'faceboook', 'fecebook'])
        ]
    
    def extract_domain(self, url):
        """
        Extract domain from URL
        
        Args:
            url: URL string
            
        Returns:
            Domain name
        """
        try:
            if not url.startswith(('http://', 'https://')):
                url = 'http://' + url
            parsed = urlparse(url)
            return parsed.netloc
        except:
            return ""
    
    def has_ip_address(self, url):
        """
        RED FLAG #1: Check if URL contains IP address instead of domain
        
        Args:
            url: URL string
            
        Returns:
            1 if has IP, 0 otherwise
        """
        # Extract the domain part only
        domain = self.extract_domain(url)
        if not domain:
            return 0
        
        # IPv4 pattern - must be ONLY digits and dots, no letters
        # Valid: 192.168.1.1 or http://192.168.1.1/
        # Invalid: google.com (has letters)
        ipv4_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
        
        # Check if domain is pure IPv4 (no letters)
        if re.match(ipv4_pattern, domain):
            return 1
        
        # Check for IPv6 in brackets
        if '[' in domain and ']' in domain:
            return 1
        
        return 0
    
    def url_length(self, url):
        """
        RED FLAG #7: Get URL length (>75-100 chars is suspicious)
        
        Args:
            url: URL string
            
        Returns:
            Length of URL
        """
        return len(url)
    
    def is_long_url(self, url):
        """
        RED FLAG #7: Check if URL is suspiciously long
        
        Args:
            url: URL string
            
        Returns:
            1 if > 75 characters, 0 otherwise
        """
        return 1 if len(url) > 75 else 0
    
    def count_special_chars(self, url):
        """
        RED FLAG #8: Count special characters in URL
        Special chars: @, -, _, %, multiple dots
        
        Args:
            url: URL string
            
        Returns:
            Dictionary of special character counts
        """
        return {
            'dot_count': url.count('.'),
            'dash_count': url.count('-'),
            'at_count': url.count('@'),
            'slash_count': url.count('/'),
            'question_count': url.count('?'),
            'equals_count': url.count('='),
            'underscore_count': url.count('_'),
            'percent_count': url.count('%'),
            'ampersand_count': url.count('&')
        }
    
    def has_suspicious_chars(self, url):
        """
        RED FLAG #8: Check if URL has suspicious special characters
        
        Args:
            url: URL string
            
        Returns:
            1 if has @ or excessive special chars, 0 otherwise
        """
        # @ symbol is highly suspicious
        if '@' in url:
            return 1
        
        # Excessive dashes or underscores
        if url.count('-') > 3 or url.count('_') > 3:
            return 1
        
        # Multiple consecutive dots
        if '..' in url:
            return 1
        
        return 0
    
    def has_suspicious_words(self, url):
        """
        RED FLAG #6: Check if URL contains suspicious keywords
        Keywords: login, verify, update, secure, confirm, reset, kyc
        
        Args:
            url: URL string
            
        Returns:
            Number of suspicious words found
        """
        url_lower = url.lower()
        count = sum(1 for word in self.suspicious_words if word in url_lower)
        return count
    
    def has_urgent_words(self, url):
        """
        GREEN FLAG #4 (inverse): Check for urgent/threatening words
        
        Args:
            url: URL string
            
        Returns:
            1 if urgent words found, 0 otherwise
        """
        urgent_words = ['urgent', 'verify', 'confirm', 'suspend', 'restricted', 'limited']
        url_lower = url.lower()
        return 1 if any(word in url_lower for word in urgent_words) else 0
    
    def is_https(self, url):
        """
        GREEN FLAG #1 / RED FLAG #4: Check if URL uses HTTPS
        
        Args:
            url: URL string
            
        Returns:
            1 if HTTPS, 0 otherwise
        """
        return 1 if url.startswith('https://') else 0
    
    def has_typosquatting(self, url):
        """
        RED FLAG #2: Detect look-alike or misspelled domains (typosquatting)
        Examples: paypaI.com (I instead of l), arnazon.in (r instead of m), goog1e.com (1 instead of l)
        
        Args:
            url: URL string
            
        Returns:
            1 if potential typosquatting detected, 0 otherwise
        """
        domain = self.extract_domain(url).lower()
        
        # First check if it's a trusted domain - if yes, it's NOT typosquatting
        for trusted in self.trusted_domains:
            if domain == trusted or domain == 'www.' + trusted:
                return 0
        
        # Check against known typosquatting patterns
        for brand, variants in self.typosquatting_patterns:
            for variant in variants:
                if variant in domain:
                    return 1
        
        # Check for suspicious character substitutions ONLY if brand is mimicked
        # Look for patterns like: "paypa1.com" (has paypal + number substitution)
        for brand in self.brand_names:
            if brand in domain:
                # Check if domain has substitution characters that suggest typosquatting
                # Only flag if we see obvious substitutions like 1 for l, 0 for o
                if ('1' in domain and 'l' in brand) or ('0' in domain and 'o' in brand):
                    # But make sure it's not the real domain
                    is_real_domain = False
                    for trusted in self.trusted_domains:
                        if brand in trusted and domain == trusted:
                            is_real_domain = True
                            break
                    if not is_real_domain:
                        return 1
        
        return 0
    
    def is_url_shortener(self, url):
        """
        RED FLAG #5: Check if URL uses a URL shortener
        Examples: bit.ly, tinyurl, t.co
        
        Args:
            url: URL string
            
        Returns:
            1 if URL shortener detected, 0 otherwise
        """
        domain = self.extract_domain(url).lower()
        return 1 if any(shortener in domain for shortener in self.url_shorteners) else 0
    
    def has_brand_mismatch(self, url):
        """
        RED FLAG #9: Brand name present but domain doesn't belong to that brand
        Examples: amazon-login.net, paypal-secure.info
        
        Args:
            url: URL string
            
        Returns:
            1 if brand mismatch detected, 0 otherwise
        """
        domain = self.extract_domain(url).lower()
        url_lower = url.lower()
        
        # Check if brand name appears in URL but domain is not official
        for brand in self.brand_names:
            if brand in url_lower:
                # Check if it's actually the official domain
                official_match = False
                for trusted in self.trusted_domains:
                    if brand in trusted and trusted in domain:
                        official_match = True
                        break
                
                if not official_match:
                    # Brand mentioned but not official domain = suspicious
                    return 1
        
        return 0
    
    def subdomain_count(self, url):
        """
        RED FLAG #3: Count number of subdomains (too many = suspicious)
        Example: login.secure.verify.bank.com.user-auth.net
        
        Args:
            url: URL string
            
        Returns:
            Number of subdomains
        """
        domain = self.extract_domain(url)
        if not domain:
            return 0
        # Count dots minus 1 (for TLD)
        parts = domain.split('.')
        return len(parts) - 2 if len(parts) > 2 else 0
    
    def has_excessive_subdomains(self, url):
        """
        RED FLAG #3: Check if URL has too many subdomains (>2 is suspicious)
        
        Args:
            url: URL string
            
        Returns:
            1 if has >2 subdomains, 0 otherwise
        """
        count = self.subdomain_count(url)
        return 1 if count > 2 else 0
    
    def has_port(self, url):
        """
        Check if URL has non-standard port
        
        Args:
            url: URL string
            
        Returns:
            1 if has port, 0 otherwise
        """
        try:
            if not url.startswith(('http://', 'https://')):
                url = 'http://' + url
            parsed = urlparse(url)
            return 1 if parsed.port else 0
        except:
            return 0
    
    def is_trusted_domain(self, url):
        """
        Check if domain is in trusted list
        
        Args:
            url: URL string
            
        Returns:
            1 if trusted, 0 otherwise
        """
        domain = self.extract_domain(url)
        for trusted in self.trusted_domains:
            if trusted in domain:
                return 1
        return 0
    
    def extract_all_features(self, url):
        """
        Extract all features from URL including RED FLAGS and GREEN FLAGS
        
        Args:
            url: URL string
            
        Returns:
            Dictionary of all URL features
        """
        if not isinstance(url, str):
            url = str(url)
        
        special_chars = self.count_special_chars(url)
        
        features = {
            # Basic features
            'url_length': self.url_length(url),
            'is_long_url': self.is_long_url(url),  # RED FLAG #7
            
            # RED FLAGS
            'has_ip': self.has_ip_address(url),  # RED FLAG #1
            'has_typosquatting': self.has_typosquatting(url),  # RED FLAG #2
            'has_excessive_subdomains': self.has_excessive_subdomains(url),  # RED FLAG #3
            'is_https': self.is_https(url),  # RED FLAG #4 (0 = suspicious)
            'is_url_shortener': self.is_url_shortener(url),  # RED FLAG #5
            'suspicious_word_count': self.has_suspicious_words(url),  # RED FLAG #6
            'has_suspicious_chars': self.has_suspicious_chars(url),  # RED FLAG #8
            'has_brand_mismatch': self.has_brand_mismatch(url),  # RED FLAG #9
            'has_urgent_words': self.has_urgent_words(url),  # Related to GREEN FLAG #4
            
            # GREEN FLAGS
            'is_trusted': self.is_trusted_domain(url),  # GREEN FLAG #2
            
            # Detailed metrics
            'subdomain_count': self.subdomain_count(url),
            'has_port': self.has_port(url),
            
            # Special character counts
            **special_chars
        }
        
        return features
    
    def extract_feature_vector(self, url):
        """
        Extract feature vector as list for ML models
        
        Args:
            url: URL string
            
        Returns:
            List of feature values
        """
        features = self.extract_all_features(url)
        return list(features.values())
    
    def analyze_url_comprehensively(self, url):
        """
        Comprehensive URL analysis with RED FLAGS and GREEN FLAGS
        Similar to email analysis - checks all indicators before ML prediction
        
        Args:
            url: Full URL string
            
        Returns:
            Dictionary with comprehensive analysis
        """
        if not isinstance(url, str):
            url = str(url)
        
        # Normalize URL
        if not url.startswith(('http://', 'https://')):
            url = 'https://' + url
        
        domain = self.extract_domain(url)
        url_lower = url.lower()
        
        # RED FLAGS (42 checks)
        red_flags = []
        
        # RF #1: IP address instead of domain
        if self.has_ip_address(url):
            red_flags.append("Uses IP address instead of domain name")
        
        # RF #2: HTTP instead of HTTPS
        if not self.is_https(url):
            red_flags.append("Uses HTTP instead of HTTPS (not secure)")
        
        # RF #3: Typosquatting
        if self.has_typosquatting(url):
            red_flags.append("Look-alike or misspelled domain detected")
        
        # RF #4: Brand in subdomain
        if self.has_brand_mismatch(url):
            red_flags.append("Brand name in URL but domain doesn't match")
        
        # RF #5: Excessive subdomains
        if self.has_excessive_subdomains(url):
            red_flags.append("Excessive number of subdomains (>2)")
        
        # RF #6: Misleading words in domain
        misleading_words = ['secure', 'login', 'verify', 'account', 'banking', 'update']
        if any(word in domain.lower() for word in misleading_words):
            red_flags.append("Domain contains misleading security words")
        
        # RF #7: Urgent/fear keywords
        if self.has_urgent_words(url):
            red_flags.append("Contains urgent or threatening keywords")
        
        # RF #8: Very long URL
        if self.is_long_url(url):
            red_flags.append(f"Unusually long URL ({len(url)} characters)")
        
        # RF #9: Suspicious special characters
        if self.has_suspicious_chars(url):
            red_flags.append("Contains suspicious special characters")
        
        # RF #10: URL shortener
        if self.is_url_shortener(url):
            red_flags.append("Uses URL shortening service")
        
        # RF #11: Encoded characters
        if '%' in url and re.search(r'%[0-9A-Fa-f]{2}', url):
            red_flags.append("Contains encoded/obfuscated characters")
        
        # RF #12: Email in URL
        if re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', url):
            red_flags.append("Contains email address in URL")
        
        # RF #13: Port numbers
        if self.has_port(url):
            red_flags.append("Uses non-standard port number")
        
        # RF #14: High-risk TLDs
        risky_tlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.top', '.xyz', '.club']
        if any(domain.endswith(tld) for tld in risky_tlds):
            red_flags.append("Uses high-risk or suspicious TLD")
        
        # RF #15: Excessive hyphens
        if domain.count('-') > 2:
            red_flags.append("Excessive hyphens in domain name")
        
        # RF #16: Login/auth path mimicry
        auth_paths = ['/login', '/signin', '/auth', '/verify', '/confirm', '/account']
        if any(path in url_lower for path in auth_paths):
            red_flags.append("URL path mimics login/authentication pages")
        
        # RF #17: Double slashes in path
        if '//' in url.split('://', 1)[-1]:
            red_flags.append("Unnecessary double slashes in URL path")
        
        # RF #18: Punycode
        if 'xn--' in domain:
            red_flags.append("Uses punycode (IDN homograph attack)")
        
        # RF #19: Random strings
        if re.search(r'[a-z]{15,}|[0-9]{8,}', domain):
            red_flags.append("Domain contains random or meaningless strings")
        
        # RF #20: Excessive query parameters
        if url.count('&') > 5 or url.count('=') > 5:
            red_flags.append("Excessive query parameters")
        
        # RF #21: Executable file extensions
        dangerous_exts = ['.exe', '.scr', '.bat', '.cmd', '.vbs', '.js', '.jar']
        if any(url_lower.endswith(ext) for ext in dangerous_exts):
            red_flags.append("URL points to executable file")
        
        # RF #22: Misleading file extensions
        if '.html.exe' in url_lower or '.pdf.html' in url_lower or '.doc.exe' in url_lower:
            red_flags.append("Misleading double file extension")
        
        # GREEN FLAGS (30 checks)
        green_flags = []
        
        # GF #1: HTTPS with valid certificate assumption
        if self.is_https(url):
            green_flags.append("Uses HTTPS (secure connection)")
        
        # GF #2: Well-known domain
        if self.is_trusted_domain(url):
            green_flags.append("Officially recognized trusted domain")
        
        # GF #3: Reasonable URL length
        if len(url) < 75:
            green_flags.append("Reasonable URL length")
        
        # GF #4: No IP address
        if not self.has_ip_address(url):
            green_flags.append("Uses proper domain name (not IP)")
        
        # GF #5: No URL shortener
        if not self.is_url_shortener(url):
            green_flags.append("Not a URL shortening service")
        
        # GF #6: No suspicious keywords
        if self.has_suspicious_words(url) == 0:
            green_flags.append("No suspicious keywords detected")
        
        # GF #7: Limited subdomains
        if not self.has_excessive_subdomains(url):
            green_flags.append("Logical subdomain structure")
        
        # GF #8: Reputable TLD
        good_tlds = ['.com', '.org', '.edu', '.gov', '.in', '.co.uk', '.net']
        if any(domain.endswith(tld) for tld in good_tlds):
            green_flags.append("Uses reputable TLD")
        
        # GF #9: Clean URL path
        if not re.search(r'%[0-9A-Fa-f]{2}', url):
            green_flags.append("Clean, readable URL (no encoding)")
        
        # GF #10: No email in URL
        if '@' not in url:
            green_flags.append("No email addresses in URL")
        
        # GF #11: Standard port
        if not self.has_port(url):
            green_flags.append("Uses standard port (80/443)")
        
        # GF #12: No punycode
        if 'xn--' not in domain:
            green_flags.append("No punycode or mixed characters")
        
        # GF #13: No excessive hyphens
        if domain.count('-') <= 2:
            green_flags.append("Normal domain structure (no excessive hyphens)")
        
        # GF #14: Reasonable query parameters
        if url.count('&') <= 5:
            green_flags.append("Normal number of query parameters")
        
        # GF #15: No executable files
        if not any(url_lower.endswith(ext) for ext in ['.exe', '.scr', '.bat', '.cmd']):
            green_flags.append("Does not point to executable file")
        
        return {
            'url': url,
            'domain': domain,
            'red_flags': red_flags,
            'red_flag_count': len(red_flags),
            'green_flags': green_flags,
            'green_flag_count': len(green_flags),
            'risk_score': len(red_flags) * 10,  # Each red flag adds 10% risk
            'safety_score': len(green_flags) * 5,  # Each green flag adds 5% safety
            'features': self.extract_all_features(url)
        }


if __name__ == "__main__":
    # Test the feature extractor
    extractor = URLFeatureExtractor()
    
    test_urls = [
        "https://www.google.com",
        "http://192.168.1.1/login",
        "http://paypal-verify.suspicious-domain.com/login?user=123",
        "https://legitimate-site.com"
    ]
    
    for url in test_urls:
        print(f"\nURL: {url}")
        features = extractor.extract_all_features(url)
        for key, value in features.items():
            print(f"  {key}: {value}")
