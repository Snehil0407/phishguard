import requests
import json

url = "http://localhost:8000/analyze/sms"

# Test the Walmart gift card scam
sms_text = "CONGRATULATIONS! You've won a $1000 Walmart gift card. Claim now: bit.ly/prize123"

payload = {
    "message": sms_text
}

print("Testing Walmart gift card scam SMS...")
print(f"SMS: {sms_text}\n")

try:
    response = requests.post(url, json=payload)
    result = response.json()
    
    print("Raw response:")
    print(json.dumps(result, indent=2))
    print("\n" + "="*80)
    print(f"Prediction: {'PHISHING' if result.get('is_phishing') else 'SAFE'}")
    print(f"Confidence: {result.get('confidence', 0):.2f}%")
    print(f"Risk Score: {result.get('risk_score', 'N/A')}")
    print(f"Severity: {result.get('severity', 'N/A')}")
    
    # Print flag counts
    explanation = result.get('explanation', {})
    print(f"\nRed Flags: {explanation.get('red_flag_count', 0)}")
    print(f"Green Flags: {explanation.get('green_flag_count', 0)}")
    
    # Print active red flags
    if explanation.get('red_flags'):
        print("\nActive Red Flags:")
        for flag in explanation['red_flags']:
            print(f"  - {flag}")
    
    # Print active green flags
    if explanation.get('green_flags'):
        print("\nActive Green Flags:")
        for flag in explanation['green_flags']:
            print(f"  - {flag}")
    
    # Print URLs found
    if explanation.get('urls_found'):
        print(f"\nURLs Found: {len(explanation['urls_found'])}")
        for url_info in explanation['urls_found']:
            print(f"  - {url_info}")
    
    print("="*80)
    
except Exception as e:
    print(f"Error: {e}")
