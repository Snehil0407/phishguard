import requests
import json

url = "http://localhost:8000/analyze/sms"

test_cases = [
    {
        "name": "Phishing SMS with URL",
        "message": "URGENT! Your account will be BLOCKED in 24hrs. Verify now: http://bit.ly/fake-verify. Last Warning!"
    },
    {
        "name": "Legitimate Transaction Alert",
        "message": "Your account ****1234 has been debited by Rs.5000. Ref No: UPI12345678. If not you, contact support via app."
    },
    {
        "name": "Prize Scam",
        "message": "Congratulations!!! You WON Rs.50,000 cashback. CLAIM NOW before it EXPIRES: http://prize-claim.online"
    }
]

for test in test_cases:
    print("\n" + "="*80)
    print(f"Test Case: {test['name']}")
    print("="*80)
    print(f"Message: {test['message']}")
    print("-"*80)
    
    try:
        response = requests.post(url, json={"message": test['message']})
        result = response.json()
        
        print(f"\n✓ Status: {response.status_code}")
        print(f"✓ Is Phishing: {result['is_phishing']}")
        print(f"✓ Confidence: {result['confidence']:.2%}")
        print(f"✓ Severity: {result['severity']}")
        print(f"✓ Risk Score: {result['risk_score']}")
        
        if result['is_phishing']:
            print(f"\n🚨 Red Flags ({result['explanation']['red_flag_count']}/40):")
            for flag in result['explanation']['red_flags'][:10]:
                print(f"   - {flag}")
            if result['explanation']['red_flag_count'] > 10:
                print(f"   ... and {result['explanation']['red_flag_count'] - 10} more")
        else:
            print(f"\n✅ Green Flags ({result['explanation']['green_flag_count']}/40):")
            for flag in result['explanation']['green_flags'][:10]:
                print(f"   - {flag}")
            if result['explanation']['green_flag_count'] > 10:
                print(f"   ... and {result['explanation']['green_flag_count'] - 10} more")
        
        if result['explanation'].get('suspicious_urls'):
            print(f"\n⚠️ Suspicious URLs found:")
            for sus_url in result['explanation']['suspicious_urls']:
                print(f"   - {sus_url['url']} (Risk: {sus_url['risk']}%)")
        
    except Exception as e:
        print(f"❌ Error: {e}")

print("\n" + "="*80)
