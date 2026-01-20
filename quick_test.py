"""Quick API test"""
import requests
import json

print("Testing PhishGuard API...\n")

# Test health
print("1. Health Check:")
r = requests.get("http://localhost:8000/health")
print(f"   Status: {r.status_code}")
print(f"   Response: {json.dumps(r.json(), indent=4)}\n")

# Test email
print("2. Email Analysis (Phishing):")
email = {
    "content": "URGENT: Your account will be closed! Click here to verify: http://fake-bank.com/verify",
    "subject": "Account Suspended"
}
r = requests.post("http://localhost:8000/analyze/email", json=email)
result = r.json()
print(f"   Phishing: {result['is_phishing']}")
print(f"   Confidence: {result['confidence']:.2%}")
print(f"   Risk: {result['risk_score']}/100 ({result['severity']})\n")

# Test SMS
print("3. SMS Analysis (Phishing):")
sms = {"message": "WINNER! Claim your $1000 prize now: bit.ly/fake-prize"}
r = requests.post("http://localhost:8000/analyze/sms", json=sms)
result = r.json()
print(f"   Phishing: {result['is_phishing']}")
print(f"   Confidence: {result['confidence']:.2%}")
print(f"   Risk: {result['risk_score']}/100 ({result['severity']})\n")

# Test URL
print("4. URL Analysis (Phishing):")
url = {"url": "http://paypal-secure-login.tk/verify.php?id=12345"}
r = requests.post("http://localhost:8000/analyze/url", json=url)
result = r.json()
print(f"   Phishing: {result['is_phishing']}")
print(f"   Confidence: {result['confidence']:.2%}")
print(f"   Risk: {result['risk_score']}/100 ({result['severity']})\n")

print("✅ All tests completed successfully!")
