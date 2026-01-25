"""Test script to verify indicator detection and display"""

from ml.predictor import PhishGuardPredictor
import json

predictor = PhishGuardPredictor()

# Test 1: Clear phishing email with multiple indicators
print("=" * 80)
print("TEST 1: Phishing Email with Multiple Indicators")
print("=" * 80)

result = predictor.predict_email(
    email_text='''Dear Customer,

Your account will be SUSPENDED in 24 hours unless you verify immediately!

Click here NOW to verify your account: http://paypal-verify.tk/login

Enter your password and credit card to confirm your identity.

DO NOT ignore this message or your account will be permanently deleted!

PayPal Security Team''',
    email_subject='URGENT: Account Suspended - Action Required',
    sender_email='security@gmail.com',
    sender_display='PayPal Security'
)

print(f"\n✅ Prediction Result:")
print(f"   Is Phishing: {result['is_phishing']}")
print(f"   Risk Score: {result['risk_score']}%")
print(f"   Confidence: {result['confidence']:.2%}")
print(f"   Severity: {result['severity']}")

print(f"\n🚨 Red Flags Detected: {result['explanation']['red_flag_count']}")
print(f"\n📋 Matched Indicators:")

# Show ALL matched indicators
matched = []
for flag, value in result['explanation']['red_flags_summary'].items():
    if value == True and flag not in ['urgency_phrases', 'attachment_types']:
        matched.append(flag)

if matched:
    for i, flag in enumerate(matched, 1):
        flag_readable = flag.replace('_', ' ').title()
        print(f"   {i}. {flag_readable}")
else:
    print("   (None)")

# Show urgency phrases if detected
if result['explanation']['red_flags_summary'].get('urgency_detected') and \
   result['explanation']['red_flags_summary'].get('urgency_phrases'):
    print(f"\n⚠️  Urgency Phrases Detected:")
    for phrase in result['explanation']['red_flags_summary']['urgency_phrases']:
        print(f"   - \"{phrase}\"")

print("\n" + "=" * 80)
print("TEST 2: Legitimate Email")
print("=" * 80)

result2 = predictor.predict_email(
    email_text='''Hello,

Your order (Wireless Mouse) has been shipped and will arrive by January 28, 2026.

You can track your package by logging into your Amazon account at www.amazon.com

Thank you for shopping with us,
Amazon Customer Service''',
    email_subject='Your Amazon Order #123-4567890-1234567',
    sender_email='no-reply@amazon.com',
    sender_display='Amazon'
)

print(f"\n✅ Prediction Result:")
print(f"   Is Phishing: {result2['is_phishing']}")
print(f"   Risk Score: {result2['risk_score']}%")
print(f"   Confidence: {result2['confidence']:.2%}")

print(f"\n🚨 Red Flags Detected: {result2['explanation']['red_flag_count']}")

print("\n" + "=" * 80)
