"""Test phishing URL"""
from ml.predictor import PhishGuardPredictor

p = PhishGuardPredictor()
r = p.predict_url('http://amaz0n-prize-winner.xyz/claim-now')

print('=' * 60)
print('PHISHING URL TEST')
print('=' * 60)
print(f"URL: http://amaz0n-prize-winner.xyz/claim-now")
print(f"Is Phishing: {r['is_phishing']}")
print(f"Confidence: {r['confidence']*100:.1f}%")
if 'explanation' in r:
    print(f"Red Flags: {r['explanation'].get('red_flag_count', 'N/A')}")
    print(f"Green Flags: {r['explanation'].get('green_flag_count', 'N/A')}")
    print(f"\nRed Flags Detected:")
    for flag in r['explanation'].get('red_flags', []):
        print(f"  ✗ {flag}")
    print(f"\nGreen Flags Detected (first 5):")
    for flag in r['explanation'].get('green_flags', [])[:5]:
        print(f"  ✓ {flag}")
print('=' * 60)
