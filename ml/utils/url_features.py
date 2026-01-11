"""
URL feature extraction utilities for PhishGuard
"""
import re
from urllib.parse import urlparse
import string

class URLFeatureExtractor:
    """Extract features from URLs for phishing detection"""
    
    def __init__(self):
        """Initialize URL feature extractor"""
        self.suspicious_words = [
            'login', 'signin', 'verify', 'account', 'update', 'secure',
            'banking', 'confirm', 'suspend', 'restricted', 'verify',
            'webscr', 'cmd', 'login', 'signin', 'ebayisapi', 'account'
        ]
        
        self.trusted_domains = [
            'google.com', 'youtube.com', 'facebook.com', 'amazon.com',
            'wikipedia.org', 'twitter.com', 'instagram.com', 'linkedin.com',
            'microsoft.com', 'apple.com', 'github.com', 'stackoverflow.com'
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
        Check if URL contains IP address instead of domain
        
        Args:
            url: URL string
            
        Returns:
            1 if has IP, 0 otherwise
        """
        ip_pattern = r'\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}'
        return 1 if re.search(ip_pattern, url) else 0
    
    def url_length(self, url):
        """
        Get URL length
        
        Args:
            url: URL string
            
        Returns:
            Length of URL
        """
        return len(url)
    
    def count_special_chars(self, url):
        """
        Count special characters in URL
        
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
            'underscore_count': url.count('_')
        }
    
    def has_suspicious_words(self, url):
        """
        Check if URL contains suspicious words
        
        Args:
            url: URL string
            
        Returns:
            Number of suspicious words found
        """
        url_lower = url.lower()
        count = sum(1 for word in self.suspicious_words if word in url_lower)
        return count
    
    def is_https(self, url):
        """
        Check if URL uses HTTPS
        
        Args:
            url: URL string
            
        Returns:
            1 if HTTPS, 0 otherwise
        """
        return 1 if url.startswith('https://') else 0
    
    def subdomain_count(self, url):
        """
        Count number of subdomains
        
        Args:
            url: URL string
            
        Returns:
            Number of subdomains
        """
        domain = self.extract_domain(url)
        return domain.count('.') - 1 if domain.count('.') > 0 else 0
    
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
        Extract all features from URL
        
        Args:
            url: URL string
            
        Returns:
            Dictionary of all URL features
        """
        if not isinstance(url, str):
            url = str(url)
        
        special_chars = self.count_special_chars(url)
        
        features = {
            'url_length': self.url_length(url),
            'has_ip': self.has_ip_address(url),
            'is_https': self.is_https(url),
            'subdomain_count': self.subdomain_count(url),
            'has_port': self.has_port(url),
            'suspicious_word_count': self.has_suspicious_words(url),
            'is_trusted': self.is_trusted_domain(url),
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
