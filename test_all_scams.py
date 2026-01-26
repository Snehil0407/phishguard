import requests
import json

sms_url = "http://localhost:8000/analyze/sms"

# Test all scam cases
test_cases = [
    {
        "name": "Walmart Gift Card Scam",
        "sms": "CONGRATULATIONS! You've won a $1000 Walmart gift card. Claim now: bit.ly/prize123"
    },
    {
        "name": "Delivery Scam",
        "sms": "Your package delivery failed. Update your address here: track-parcel.xyz/update"
    },
    {
        "name": "Delivery with Defanged URL",
        "sms": "Your package could not be delivered due to incomplete address.\nUpdate details within 2 hours to avoid return:\nhttp://track-myparcel[.]in/update"
    },
    {
        "name": "PM Relief Fund Scam",
        "sms": "PM Relief Fund benefit ₹8,500 approved.\nComplete KYC today to receive amount:\nhttp://pm-relief-benefit[.]org/claim"
    },
    {
        "name": "Legitimate Transaction (Should be SAFE)",
        "sms": "Your account ****1234 debited by Rs.500 on 26-Jan-26. Ref No: 12345678. For queries call 1800-XXX-XXXX"
    }
]

print("="*80)
print("COMPREHENSIVE SCAM DETECTION TEST")
print("="*80)

for i, test in enumerate(test_cases, 1):
    print(f"\n{i}. {test['name']}")
    print("-" * 80)
    
    try:
        response = requests.post(sms_url, json={"message": test['sms']})
        result = response.json()
        
        is_phishing = result.get('is_phishing')
        confidence = result.get('confidence', 0) * 100
        risk = result.get('risk_score', 0)
        
        # Color coding
        status = "🔴 PHISHING" if is_phishing else "🟢 SAFE"
        
        print(f"Result: {status}")
        print(f"Confidence: {confidence:.2f}%")
        print(f"Risk Score: {risk}")
        
        explanation = result.get('explanation', {})
        red_flags = explanation.get('red_flag_count', 0)
        green_flags = explanation.get('green_flag_count', 0)
        
        print(f"Red Flags: {red_flags} | Green Flags: {green_flags}")
        
        if is_phishing and explanation.get('red_flags'):
            print(f"Top Red Flags: {', '.join(explanation['red_flags'][:5])}")
        
        suspicious_urls = explanation.get('suspicious_urls', [])
        if suspicious_urls:
            print(f"Suspicious URLs: {len(suspicious_urls)}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

print("\n" + "="*80)
print("TEST COMPLETE")
print("="*80)
