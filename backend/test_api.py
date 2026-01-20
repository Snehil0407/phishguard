"""
Test script for PhishGuard API endpoints
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("\n" + "="*60)
    print("Testing /health endpoint...")
    print("="*60)
    
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    return response.status_code == 200

def test_email_analysis():
    """Test email analysis endpoint"""
    print("\n" + "="*60)
    print("Testing /analyze/email endpoint...")
    print("="*60)
    
    # Test phishing email
    phishing_email = {
        "content": """Dear Customer,
        
Your account has been suspended due to suspicious activity. 
Please verify your identity immediately by clicking the link below:

http://secure-bank-verify.com/login

Enter your username, password, and social security number to reactivate your account.
This is urgent and must be done within 24 hours or your account will be permanently closed.

Best regards,
Security Team""",
        "subject": "URGENT: Verify Your Account Now"
    }
    
    response = requests.post(f"{BASE_URL}/analyze/email", json=phishing_email)
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"\nPhishing Email Test:")
    print(f"  Is Phishing: {result['is_phishing']}")
    print(f"  Confidence: {result['confidence']:.2%}")
    print(f"  Risk Score: {result['risk_score']}/100")
    print(f"  Severity: {result['severity']}")
    
    # Test legitimate email
    legitimate_email = {
        "content": """Hi John,

Just wanted to remind you about our team meeting tomorrow at 10 AM.
We'll be discussing the quarterly report and planning for next month.

Please bring your project updates.

Best,
Sarah""",
        "subject": "Team Meeting Tomorrow"
    }
    
    response = requests.post(f"{BASE_URL}/analyze/email", json=legitimate_email)
    print(f"\nLegitimate Email Test:")
    result = response.json()
    print(f"  Is Phishing: {result['is_phishing']}")
    print(f"  Confidence: {result['confidence']:.2%}")
    print(f"  Risk Score: {result['risk_score']}/100")
    print(f"  Severity: {result['severity']}")

def test_sms_analysis():
    """Test SMS analysis endpoint"""
    print("\n" + "="*60)
    print("Testing /analyze/sms endpoint...")
    print("="*60)
    
    # Test phishing SMS
    phishing_sms = {
        "message": "WINNER! You have been selected to receive a $1000 Walmart gift card. Claim now at: bit.ly/claim-prize-now Limited time offer!"
    }
    
    response = requests.post(f"{BASE_URL}/analyze/sms", json=phishing_sms)
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"\nPhishing SMS Test:")
    print(f"  Is Phishing: {result['is_phishing']}")
    print(f"  Confidence: {result['confidence']:.2%}")
    print(f"  Risk Score: {result['risk_score']}/100")
    print(f"  Severity: {result['severity']}")
    
    # Test legitimate SMS
    legitimate_sms = {
        "message": "Hi! Just wanted to check if you're still coming to dinner tonight at 7pm. Let me know!"
    }
    
    response = requests.post(f"{BASE_URL}/analyze/sms", json=legitimate_sms)
    print(f"\nLegitimate SMS Test:")
    result = response.json()
    print(f"  Is Phishing: {result['is_phishing']}")
    print(f"  Confidence: {result['confidence']:.2%}")
    print(f"  Risk Score: {result['risk_score']}/100")
    print(f"  Severity: {result['severity']}")

def test_url_analysis():
    """Test URL analysis endpoint"""
    print("\n" + "="*60)
    print("Testing /analyze/url endpoint...")
    print("="*60)
    
    # Test phishing URL
    phishing_url = {
        "url": "http://secure-paypal-verify.com/login.php?user=account&verify=true"
    }
    
    response = requests.post(f"{BASE_URL}/analyze/url", json=phishing_url)
    print(f"Status Code: {response.status_code}")
    result = response.json()
    print(f"\nPhishing URL Test:")
    print(f"  Is Phishing: {result['is_phishing']}")
    print(f"  Confidence: {result['confidence']:.2%}")
    print(f"  Risk Score: {result['risk_score']}/100")
    print(f"  Severity: {result['severity']}")
    
    # Test legitimate URL
    legitimate_url = {
        "url": "https://www.github.com/user/repository"
    }
    
    response = requests.post(f"{BASE_URL}/analyze/url", json=legitimate_url)
    print(f"\nLegitimate URL Test:")
    result = response.json()
    print(f"  Is Phishing: {result['is_phishing']}")
    print(f"  Confidence: {result['confidence']:.2%}")
    print(f"  Risk Score: {result['risk_score']}/100")
    print(f"  Severity: {result['severity']}")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("PHISHGUARD API TESTING SUITE")
    print("="*60)
    
    try:
        # Run all tests
        test_health()
        test_email_analysis()
        test_sms_analysis()
        test_url_analysis()
        
        print("\n" + "="*60)
        print("✅ ALL TESTS COMPLETED SUCCESSFULLY!")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Cannot connect to API. Make sure the server is running on http://localhost:8000")
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
