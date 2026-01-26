import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ml.predictor import PhishGuardPredictor

print("Creating predictor...")
predictor = PhishGuardPredictor()
print("Predictor created successfully!")

print("\nTesting URL prediction with defanged URL...")
result = predictor.predict_url("http://paypal-billing-update[.]info/login")

print("\nResult:")
for key, value in result.items():
    if key != 'explanation':
        print(f"  {key}: {value}")
    else:
        print(f"  explanation keys: {list(value.keys())}")

print("\nTest completed successfully!")
