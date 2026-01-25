"""
Test Comprehensive Email Analysis with RED/GREEN Flags
"""
import requests
import json

# Test Case 1: Obvious Phishing Email (Multiple RED FLAGS)
phishing_email = {
    "subject": "URGENT: Your Account Will Be Suspended!",
    "content": """
Dear User,

Your account has been SUSPENDED due to suspicious activity.
You MUST verify your identity IMMEDIATELY to avoid permanent closure.

Click here to verify: http://secure-verify-account.tk/login.php
Enter your password and credit card details to confirm.

If you don't act within 24 hours, your account will be permanently deleted.

Act now or lose access forever!

Security Team
""",
    "sender_email": "security@fake-bank.tk",
    "sender_display": "Bank of America Security"
}

# Test Case 2: Legitimate Email (Multiple GREEN FLAGS)
legitimate_email = {
    "subject": "Your order #12345 has shipped",
    "content": """
Hi John Smith,

We're writing to let you know that your order #12345 has been shipped.

You can track your package by visiting our website and signing into your account manually.

Expected delivery: January 25, 2026

Thank you for shopping with us!

Best regards,
Customer Service Team
Amazon.com
""",
    "sender_email": "orders@amazon.com",
    "sender_display": "Amazon Orders"
}

# Test Case 3: Email with Document Attachment Mention
attachment_email = {
    "subject": "Invoice for your recent purchase",
    "content": """
Hello,

Please find attached the invoice.exe file for your recent purchase.

Download and open the attachment to view details.

Regards
""",
    "sender_email": "billing@unknown-shop.xyz",
    "sender_display": "Shop Billing"
}

def test_email(email_data, test_name):
    print("\n" + "=" * 80)
    print(f"TEST: {test_name}")
    print("=" * 80)
    print(f"Subject: {email_data['subject']}")
    print(f"From: {email_data['sender_display']} <{email_data['sender_email']}>")
    print(f"Content Preview: {email_data['content'][:80]}...")
    
    response = requests.post(
        "http://localhost:8000/analyze/email",
        json=email_data
    )
    
    if response.status_code == 200:
        result = response.json()
        
        print("\n" + "-" * 80)
        print("PREDICTION RESULT")
        print("-" * 80)
        print(f"🎯 Is Phishing: {result['is_phishing']}")
        print(f"📊 Confidence: {result['confidence']:.2%}")
        print(f"⚠️  Risk Score: {result['risk_score']}/100")
        print(f"🚨 Severity: {result['severity'].upper()}")
        
        explanation = result['explanation']
        
        # RED FLAGS
        if 'red_flags' in explanation:
            red = explanation['red_flags']
            print("\n🚩 RED FLAGS DETECTED: {}/10".format(red['total_score']))
            if red['urgency_detected']:
                print(f"  • Urgent language: {red['urgency_phrases']}")
            if red['generic_greeting']:
                print(f"  • Generic greeting detected")
            if red['sensitive_info_request']:
                print(f"  • Requests sensitive info: {red['sensitive_items']}")
            if red['suspicious_attachments']:
                print(f"  • Suspicious attachments: {red['attachment_types']}")
            if red['domain_mismatch']:
                print(f"  • Domain mismatch detected")
            if red['grammar_issues']:
                print(f"  • Grammar/formatting issues found")
            if red['pressure_tactics']:
                print(f"  • Pressure tactics detected")
        
        # GREEN FLAGS
        if 'green_flags' in explanation:
            green = explanation['green_flags']
            print("\n✅ GREEN FLAGS DETECTED: {}/10".format(green['total_score']))
            if green['trusted_domain']:
                print(f"  • Trusted domain: {green['domain']}")
            if green['personalized_greeting']:
                print(f"  • Personalized greeting")
            if green['professional_language']:
                print(f"  • Professional language")
        
        # Keywords and URLs
        if explanation.get('keywords_found'):
            print(f"\n🔍 Suspicious Keywords: {', '.join(explanation['keywords_found'][:5])}")
        
        if explanation.get('urls_found'):
            print(f"\n🔗 URLs Found: {explanation['urls_found']}")
        
        if explanation.get('suspicious_urls'):
            print(f"\n⚠️  MALICIOUS LINKS DETECTED:")
            for url_info in explanation['suspicious_urls']:
                print(f"  • {url_info['url']} (Risk: {url_info['risk']}%)")
        
        # Analysis method
        print(f"\n📋 Analysis Method: {explanation.get('analysis_method', 'standard')}")
        if 'ml_confidence' in explanation:
            print(f"   ML Confidence: {explanation['ml_confidence']:.2%}")
            print(f"   Adjusted Confidence: {explanation['adjusted_confidence']:.2%}")
        
        print("\n" + "=" * 80)
        
    else:
        print(f"\n❌ Error: {response.status_code}")
        print(response.text)

# Run tests
print("\n" + "╔" + "=" * 78 + "╗")
print("║" + " " * 20 + "COMPREHENSIVE EMAIL ANALYSIS TEST" + " " * 25 + "║")
print("╚" + "=" * 78 + "╝")

test_email(phishing_email, "Phishing Email with Multiple RED FLAGS")
test_email(legitimate_email, "Legitimate Email with GREEN FLAGS")
test_email(attachment_email, "Email with Suspicious Attachment")

print("\n\n✅ ALL TESTS COMPLETED\n")
