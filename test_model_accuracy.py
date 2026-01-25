"""
Test script to verify model predictions
"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

from ml.predictor import get_predictor

def test_predictions():
    """Test with clear legitimate and phishing examples"""
    predictor = get_predictor()
    
    print("=" * 80)
    print("TESTING MODEL PREDICTIONS")
    print("=" * 80)
    
    # Test 1: Clear PHISHING email
    print("\n" + "=" * 80)
    print("TEST 1: OBVIOUS PHISHING EMAIL")
    print("=" * 80)
    phishing_email = """
    URGENT ACTION REQUIRED!
    
    Your bank account has been LOCKED due to suspicious activity!
    
    Click here IMMEDIATELY to verify your identity and unlock your account:
    http://secure-bank-verify-123.com/login
    
    WARNING: Failure to verify within 24 hours will result in permanent account closure!
    
    Enter your:
    - Username
    - Password
    - Credit card number
    - CVV
    - Social Security Number
    
    DO NOT IGNORE THIS EMAIL!
    """
    
    result = predictor.predict_email(phishing_email)
    print(f"\nContent: {phishing_email[:100]}...")
    print(f"\n📊 Prediction Result:")
    print(f"   Is Phishing: {result['is_phishing']}")
    print(f"   Confidence: {result['confidence']:.2%}")
    print(f"   Risk Score: {result['risk_score']}/100")
    print(f"   Expected: TRUE (This IS phishing)")
    print(f"   ✓ CORRECT" if result['is_phishing'] else "   ✗ WRONG - MODEL INVERTED!")
    
    # Test 2: Clear LEGITIMATE email
    print("\n" + "=" * 80)
    print("TEST 2: OBVIOUS LEGITIMATE EMAIL")
    print("=" * 80)
    legitimate_email = """
    Hi Sarah,
    
    Hope you're having a great week! I wanted to follow up on our meeting last Tuesday
    about the quarterly reports. 
    
    I've attached the updated spreadsheet with the latest figures. Could you please
    review it when you have a moment? Let me know if you need any clarifications.
    
    Looking forward to hearing from you!
    
    Best regards,
    John Smith
    Marketing Manager
    """
    
    result = predictor.predict_email(legitimate_email)
    print(f"\nContent: {legitimate_email[:100]}...")
    print(f"\n📊 Prediction Result:")
    print(f"   Is Phishing: {result['is_phishing']}")
    print(f"   Confidence: {result['confidence']:.2%}")
    print(f"   Risk Score: {result['risk_score']}/100")
    print(f"   Expected: FALSE (This is legitimate)")
    print(f"   ✓ CORRECT" if not result['is_phishing'] else "   ✗ WRONG - MODEL INVERTED!")
    
    # Test 3: Phishing SMS
    print("\n" + "=" * 80)
    print("TEST 3: OBVIOUS PHISHING SMS")
    print("=" * 80)
    phishing_sms = "WINNER! You've won $5000! Claim NOW: http://bit.ly/prize123 Reply with SSN and bank details!"
    
    result = predictor.predict_sms(phishing_sms)
    print(f"\nContent: {phishing_sms}")
    print(f"\n📊 Prediction Result:")
    print(f"   Is Phishing: {result['is_phishing']}")
    print(f"   Confidence: {result['confidence']:.2%}")
    print(f"   Risk Score: {result['risk_score']}/100")
    print(f"   Expected: TRUE (This IS phishing)")
    print(f"   ✓ CORRECT" if result['is_phishing'] else "   ✗ WRONG - MODEL INVERTED!")
    
    # Test 4: Legitimate SMS
    print("\n" + "=" * 80)
    print("TEST 4: OBVIOUS LEGITIMATE SMS")
    print("=" * 80)
    legitimate_sms = "Hey! Just wanted to remind you about lunch tomorrow at 1pm. See you then!"
    
    result = predictor.predict_sms(legitimate_sms)
    print(f"\nContent: {legitimate_sms}")
    print(f"\n📊 Prediction Result:")
    print(f"   Is Phishing: {result['is_phishing']}")
    print(f"   Confidence: {result['confidence']:.2%}")
    print(f"   Risk Score: {result['risk_score']}/100")
    print(f"   Expected: FALSE (This is legitimate)")
    print(f"   ✓ CORRECT" if not result['is_phishing'] else "   ✗ WRONG - MODEL INVERTED!")
    
    print("\n" + "=" * 80)
    print("TEST COMPLETE")
    print("=" * 80)

if __name__ == "__main__":
    test_predictions()
