import requests
import json

sms_url = "http://localhost:8000/analyze/sms"

# Test the PM Relief Fund scam
sms_text = """PM Relief Fund benefit ₹8,500 approved.
Complete KYC today to receive amount:
http://pm-relief-benefit[.]org/claim"""

print("="*80)
print("PM RELIEF FUND SCAM TEST")
print("="*80)
print(f"SMS:\n{sms_text}\n")

try:
    response = requests.post(sms_url, json={"message": sms_text})
    result = response.json()
    
    print(f"Prediction: {'PHISHING' if result.get('is_phishing') else 'SAFE'}")
    print(f"Confidence: {result.get('confidence', 0)*100:.2f}%")
    print(f"Risk Score: {result.get('risk_score', 'N/A')}")
    print(f"Severity: {result.get('severity', 'N/A')}")
    
    explanation = result.get('explanation', {})
    print(f"\nRed Flags: {explanation.get('red_flag_count', 0)}")
    if explanation.get('red_flags'):
        print("Active Red Flags:")
        for flag in explanation['red_flags']:
            print(f"  - {flag}")
    
    print(f"\nGreen Flags: {explanation.get('green_flag_count', 0)}")
    
    urls_found = explanation.get('urls_found', [])
    print(f"\nURLs Found: {len(urls_found)}")
    for url in urls_found:
        print(f"  - {url}")
    
    suspicious_urls = explanation.get('suspicious_urls', [])
    print(f"\nSuspicious URLs: {len(suspicious_urls)}")
    for url_info in suspicious_urls:
        print(f"  - URL: {url_info.get('url')}")
        print(f"    Risk: {url_info.get('risk')}")
        print(f"    Red Flags: {url_info.get('red_flags')}")
    
except Exception as e:
    print(f"Error: {e}")

print("="*80)
