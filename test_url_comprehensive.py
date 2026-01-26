"""Test comprehensive URL analysis with 40+40 flags"""
from ml.utils.url_features import URLFeatureExtractor

extractor = URLFeatureExtractor()

# Test phishing URL
phishing_url = "http://amaz0n-prize-winner.xyz/claim-now"
result = extractor.analyze_url_comprehensively(phishing_url)

print("="*60)
print(f"URL: {phishing_url}")
print("="*60)
print(f"Red Flags: {result['red_flag_count']}/40")
print(f"Green Flags: {result['green_flag_count']}/40")
print(f"Risk Score: {result['risk_score']}%")
print(f"Safety Score: {result['safety_score']}%")
print(f"\nDetected Red Flags:")
for flag in result['red_flags_list']:
    print(f"  ✗ {flag}")
print(f"\nDetected Green Flags:")
for flag in result['green_flags_list'][:10]:  # Show first 10
    print(f"  ✓ {flag}")
if len(result['green_flags_list']) > 10:
    print(f"  ... and {len(result['green_flags_list']) - 10} more")

# Test legitimate URL
print("\n" + "="*60)
github_url = "https://github.com/settings/security"
result2 = extractor.analyze_url_comprehensively(github_url)
print(f"URL: {github_url}")
print("="*60)
print(f"Red Flags: {result2['red_flag_count']}/40")
print(f"Green Flags: {result2['green_flag_count']}/40")
print(f"Risk Score: {result2['risk_score']}%")
print(f"Safety Score: {result2['safety_score']}%")
