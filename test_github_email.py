"""Test the exact GitHub email the user reported"""
import requests
import json

url = "http://localhost:8000/analyze/email"

email_data = {
    "content": """Hi Snehil,

We noticed a sign-in to your GitHub account from a new device running Windows in India.

You can review your recent activity here:
https://github.com/settings/security

If this was you, no further action is required.

GitHub Security""",
    "subject": "New Sign-In to Your GitHub Account",
    "sender_email": "security@github.com",
    "sender_display": "GitHub Security"
}

response = requests.post(url, json=email_data)
result = response.json()

print("=" * 60)
print("GITHUB EMAIL TEST RESULTS")
print("=" * 60)
print(f"Is Phishing: {result['is_phishing']}")
print(f"Risk Score: {result['risk_score']}%")
print(f"Severity: {result['severity']}")
print(f"Confidence: {result['confidence'] * 100:.2f}%")
print(f"\nRed Flags: {result['explanation']['red_flag_count']}")
print(f"Green Flags: {result['explanation']['green_flag_count']}")
print(f"\nSuspicious URLs: {len(result['explanation'].get('suspicious_urls', []))}")
print(f"Safe URLs: {len(result['explanation'].get('safe_urls', []))}")

if result['explanation'].get('safe_urls'):
    print("\nSafe URLs found:")
    for url in result['explanation']['safe_urls']:
        print(f"  ✓ {url}")

print("\n" + "=" * 60)
print(f"VERDICT: {'⚠️ PHISHING' if result['is_phishing'] else '✅ SAFE'}")
print("=" * 60)
