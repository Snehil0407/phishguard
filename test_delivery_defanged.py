import requests
import json

sms_url = "http://localhost:8000/analyze/sms"
url_scanner_url = "http://localhost:8000/analyze/url"

# Test the delivery scam SMS with defanged URL
sms_text = """Your package could not be delivered due to incomplete address.
Update details within 2 hours to avoid return:
http://track-myparcel[.]in/update"""

print("="*80)
print("TEST 1: SMS Analysis with Defanged URL")
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
    
    # Check URLs
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

print("\n" + "="*80)
print("TEST 2: Direct URL Scanner Test - Defanged")
print("="*80)

test_url = "http://track-myparcel[.]in/update"
print(f"URL: {test_url}\n")

try:
    response = requests.post(url_scanner_url, json={"url": test_url})
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
    
except Exception as e:
    print(f"Error: {e}")

print("\n" + "="*80)
print("TEST 3: Direct URL Scanner Test - Normal (not defanged)")
print("="*80)

test_url2 = "http://track-myparcel.in/update"
print(f"URL: {test_url2}\n")

try:
    response = requests.post(url_scanner_url, json={"url": test_url2})
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
    
except Exception as e:
    print(f"Error: {e}")

print("="*80)
