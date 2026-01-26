import requests
import json
import sys

email_url = "http://localhost:8000/analyze/email"

# Test email with suspicious sender
test_email = {
    "subject": "URGENT: Verify Your Account NOW!",
    "content": "Dear user, your account will be suspended unless you verify immediately. Click here: http://verify-account.xyz/login",
    "sender_email": "support@gmaiil.com",  # Misspelled gmail
    "sender_display": "PayPal Support"
}

sys.stdout.write("="*80 + "\n")
sys.stdout.write("TESTING EMAIL SENDER ANALYSIS\n")
sys.stdout.write("="*80 + "\n")
sys.stdout.write(f"Sender Email: {test_email['sender_email']}\n")
sys.stdout.write(f"Sender Display: {test_email['sender_display']}\n")
sys.stdout.write(f"Subject: {test_email['subject']}\n\n")
sys.stdout.flush()

response = requests.post(email_url, json=test_email)
result = response.json()

sys.stdout.write(f"Prediction: {'PHISHING' if result.get('is_phishing') else 'SAFE'}\n")
sys.stdout.write(f"Confidence: {result.get('confidence', 0)*100:.2f}%\n")
sys.stdout.write(f"Risk Score: {result.get('risk_score', 'N/A')}\n\n")
sys.stdout.flush()

explanation = result.get('explanation', {})

# Check red_flags_summary
if 'red_flags_summary' in explanation:
    sys.stdout.write("Email Red Flags Summary:\n")
    summary = explanation['red_flags_summary']
    
    email_flags = {
        'misspelled_domain': 'Misspelled Domain',
        'free_email_provider': 'Free Email Provider',
        'suspicious_tld': 'Suspicious TLD',
        'random_email_pattern': 'Random Email Pattern',
        'display_name_mismatch': 'Display Name Mismatch',
        'email_spoofing': 'Email Spoofing'
    }
    
    for flag_key, flag_name in email_flags.items():
        if summary.get(flag_key):
            sys.stdout.write(f"  ✓ {flag_name}\n")
    sys.stdout.flush()
else:
    sys.stdout.write("❌ No red_flags_summary in response!\n")
    sys.stdout.flush()

sys.stdout.write("\nFull red_flags_summary:\n")
sys.stdout.write(json.dumps(explanation.get('red_flags_summary', {}), indent=2) + "\n")
sys.stdout.flush()
