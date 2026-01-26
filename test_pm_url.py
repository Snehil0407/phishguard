import requests

url_scanner_url = "http://localhost:8000/analyze/url"
test_url = "http://pm-relief-benefit[.]org/claim"

print(f"Testing URL: {test_url}\n")

response = requests.post(url_scanner_url, json={"url": test_url})
result = response.json()

print(f"Prediction: {'PHISHING' if result.get('is_phishing') else 'SAFE'}")
print(f"Confidence: {result.get('confidence', 0)*100:.2f}%")
print(f"Risk Score: {result.get('risk_score', 'N/A')}")

explanation = result.get('explanation', {})
print(f"\nRed Flags: {explanation.get('red_flag_count', 0)}")
if explanation.get('red_flags'):
    for flag in explanation['red_flags']:
        print(f"  - {flag}")
