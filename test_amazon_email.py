from ml.predictor import PhishGuardPredictor

predictor = PhishGuardPredictor()

# Test with sender email
test_email = {
    'subject': 'Your Amazon Order #403-9821736-1123456',
    'body': '''Hello Snehil,

Thank you for your recent order. Your order #403-9821736-1123456 has been confirmed and will be shipped soon.

Order Details:
- Product: Wireless Mouse
- Quantity: 1
- Total: $29.99

Your order will be delivered within 3-5 business days.

Best regards,
Amazon Customer Service''',
    'sender_email': 'no-reply@amazon.com',
    'sender_name': 'Amazon'
}

print("Testing Amazon email WITH sender:")
result = predictor.predict_email(
    test_email['body'],
    test_email['sender_email'],
    test_email.get('sender_name', ''),
    test_email['subject']
)
print(f"  Is Phishing: {result['is_phishing']}")
print(f"  Risk Score: {result['risk_score']}%")
print(f"  Confidence: {result['confidence']}")
print(f"  Severity: {result['severity']}")

# Test without sender email
print("\nTesting Amazon email WITHOUT sender:")
result2 = predictor.predict_email(
    test_email['body'],
    '',
    '',
    test_email['subject']
)
print(f"  Is Phishing: {result2['is_phishing']}")
print(f"  Risk Score: {result2['risk_score']}%")
print(f"  Confidence: {result2['confidence']}")
print(f"  Severity: {result2['severity']}")
