"""Test GitHub URL in both URL scanner and Email scanner"""

from ml.predictor import PhishGuardPredictor

predictor = PhishGuardPredictor()

print("=" * 80)
print("TEST 1: GitHub URL in URL Scanner")
print("=" * 80)

url_result = predictor.predict_url('https://github.com/settings/security')
print(f"URL: https://github.com/settings/security")
print(f"Is Phishing: {url_result['is_phishing']}")
print(f"Risk Score: {url_result['risk_score']}%")
print(f"Confidence: {url_result['confidence']:.2%}")

print("\n" + "=" * 80)
print("TEST 2: Email with GitHub URL")
print("=" * 80)

email_result = predictor.predict_email(
    email_text="""Hello,

Please update your security settings at:
https://github.com/settings/security

Thanks,
GitHub Team""",
    email_subject="Security Settings Update",
    sender_email="noreply@github.com",
    sender_display="GitHub"
)

print(f"Is Phishing: {email_result['is_phishing']}")
print(f"Risk Score: {email_result['risk_score']}%")
print(f"Confidence: {email_result['confidence']:.2%}")

# Check URL analysis in email
if 'suspicious_urls' in email_result['explanation']:
    print(f"\nSuspicious URLs found: {len(email_result['explanation']['suspicious_urls'])}")
    for url_info in email_result['explanation']['suspicious_urls']:
        print(f"  - {url_info['url']}: {url_info['risk']}% risk")

if 'safe_urls' in email_result['explanation']:
    print(f"Safe URLs found: {len(email_result['explanation']['safe_urls'])}")
    for url in email_result['explanation']['safe_urls']:
        print(f"  - {url}")

print("\n" + "=" * 80)
