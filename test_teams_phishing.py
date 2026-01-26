import requests
import json

url = "http://localhost:8000/analyze/url"
test_url = "http://teams-docs-access[.]online/view"

payload = {"url": test_url}

try:
    print(f"Testing URL: {test_url}")
    print("="*60)
    
    response = requests.post(url, json=payload)
    result = response.json()
    
    print(f"\nStatus Code: {response.status_code}")
    print(f"Is Phishing: {result['is_phishing']}")
    print(f"Confidence: {result['confidence']:.2%}")
    print(f"Severity: {result['severity']}")
    print(f"Risk Score: {result['risk_score']}")
    
    print(f"\n🚨 Red Flags ({result['explanation']['red_flag_count']}/40):")
    for flag in result['explanation']['red_flags']:
        print(f"  - {flag}")
    
    print(f"\n✅ Green Flags ({result['explanation']['green_flag_count']}/40):")
    for flag in result['explanation']['green_flags'][:10]:
        print(f"  - {flag}")
    if result['explanation']['green_flag_count'] > 10:
        print(f"  ... and {result['explanation']['green_flag_count'] - 10} more")
    
except Exception as e:
    print(f"Error: {e}")
    if hasattr(e, 'response'):
        print(f"Response: {e.response.text}")
