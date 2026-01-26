import requests
import json

url = "http://localhost:8000/analyze/url"
test_urls = [
    ("http://google.com", "Safe URL"),
    ("http://paypal-billing-update[.]info/login", "Defanged Phishing URL")
]

for test_url, description in test_urls:
    payload = {"url": test_url}
    
    try:
        print(f"\n{'='*60}")
        print(f"Testing: {description}")
        print(f"URL: {test_url}")
        print(f"{'='*60}")
        
        response = requests.post(url, json=payload)
        result = response.json()
        
        print(f"Status: {response.status_code}")
        print(f"Is Phishing: {result['is_phishing']}")
        print(f"Confidence: {result['confidence']:.2%}")
        print(f"Severity: {result['severity']}")
        print(f"Risk Score: {result['risk_score']}")
        print(f"\nRed Flags ({result['explanation']['red_flag_count']}/40):")
        for flag in result['explanation']['red_flags'][:5]:  # Show first 5
            print(f"  🚨 {flag}")
        if result['explanation']['red_flag_count'] > 5:
            print(f"  ... and {result['explanation']['red_flag_count'] - 5} more")
        
        print(f"\nGreen Flags ({result['explanation']['green_flag_count']}/40):")
        for flag in result['explanation']['green_flags'][:5]:  # Show first 5
            print(f"  ✅ {flag}")
        if result['explanation']['green_flag_count'] > 5:
            print(f"  ... and {result['explanation']['green_flag_count'] - 5} more")
            
    except Exception as e:
        print(f"Error: {e}")
