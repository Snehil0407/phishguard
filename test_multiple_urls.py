"""Test multiple URLs with the new 40+40 flags system"""
from ml.predictor import PhishGuardPredictor

p = PhishGuardPredictor()

test_urls = [
    ("https://www.google.com", "Legitimate - Google"),
    ("http://192.168.1.1/login", "Suspicious - IP address"),
    ("https://github.com", "Legitimate - GitHub"),
    ("http://amaz0n-prize-winner.xyz/claim-now", "Phishing - Typosquatting"),
    ("https://paypa1-secure-login.tk/verify", "Phishing - Typosquatting + suspicious TLD")
]

for url, description in test_urls:
    result = p.predict_url(url)
    print("\n" + "="*60)
    print(f"Test: {description}")
    print(f"URL: {url}")
    print("="*60)
    print(f"Is Phishing: {result['is_phishing']}")
    print(f"Confidence: {result['confidence']*100:.1f}%")
    print(f"Risk Score: {result['risk_score']}%")
    print(f"Red Flags: {result['explanation']['red_flag_count']}/40")
    print(f"Green Flags: {result['explanation']['green_flag_count']}/40")
    
    if result['explanation']['red_flag_count'] > 0:
        print(f"\nTop Red Flags:")
        for flag in result['explanation']['red_flags'][:5]:
            print(f"  ✗ {flag}")
