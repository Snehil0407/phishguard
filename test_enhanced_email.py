"""
Test Enhanced Email Analysis
Tests the new keyword and URL detection features
"""
import requests
import json

# Test email with suspicious keywords and phishing URL
test_email = {
    "subject": "URGENT: Verify Your Account Now!",
    "content": """
Dear Customer,

Your account has been suspended due to suspicious activity. 
You must verify your identity immediately to avoid permanent closure.

Click here to verify: http://secure-verify-account.tk/login

If you don't act within 24 hours, your account will be permanently deleted.

Best regards,
Security Team
"""
}

print("=" * 70)
print("TESTING ENHANCED EMAIL ANALYSIS")
print("=" * 70)
print(f"\nSubject: {test_email['subject']}")
print(f"Content Preview: {test_email['content'][:100]}...")

# Send request
response = requests.post(
    "http://localhost:8000/analyze/email",
    json=test_email
)

if response.status_code == 200:
    result = response.json()
    print("\n" + "=" * 70)
    print("ANALYSIS RESULT")
    print("=" * 70)
    print(f"Is Phishing: {result['is_phishing']}")
    print(f"Confidence: {result['confidence']:.2%}")
    print(f"Risk Score: {result['risk_score']:.2f}")
    print(f"Severity: {result['severity']}")
    
    print("\n" + "-" * 70)
    print("EXPLANATION DETAILS")
    print("-" * 70)
    
    explanation = result['explanation']
    
    # Show indicators
    print(f"\nPhishing Keywords Found: {explanation.get('phishing_keywords', 0)}")
    print(f"URLs Found: {explanation.get('urls_count', 0)}")
    print(f"Uppercase Ratio: {explanation.get('uppercase_ratio', 0):.2%}")
    print(f"Special Chars: {explanation.get('special_chars', 0)}")
    
    # Show actual keywords found
    if 'keywords_found' in explanation and explanation['keywords_found']:
        print("\n🚨 SUSPICIOUS KEYWORDS DETECTED:")
        for keyword in explanation['keywords_found']:
            print(f"  • {keyword}")
    
    # Show URLs found
    if 'urls_found' in explanation and explanation['urls_found']:
        print("\n🔗 LINKS FOUND:")
        for url in explanation['urls_found']:
            print(f"  • {url}")
    
    # Show suspicious URLs
    if 'suspicious_urls' in explanation and explanation['suspicious_urls']:
        print("\n⚠️ SUSPICIOUS LINKS DETECTED:")
        for url_info in explanation['suspicious_urls']:
            print(f"  • {url_info['url']}")
            print(f"    Risk Score: {url_info['risk']:.2%}")
    
    print("\n" + "=" * 70)
    print("✅ TEST COMPLETED")
    print("=" * 70)
else:
    print(f"\n❌ Error: {response.status_code}")
    print(response.text)
