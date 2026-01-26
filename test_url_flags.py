"""Test comprehensive URL flag system - 40+40 flags"""
from ml.utils.url_features import URLFeatureExtractor

extractor = URLFeatureExtractor()

# Test URLs
test_cases = [
    ("https://github.com/settings/security", "Safe - GitHub"),
    ("http://192.168.1.1/login", "Phishing - IP address + HTTP"),
    ("http://paypa1-verify.tk/login?user=admin&pass=123", "Phishing - typosquatting + suspicious TLD"),
    ("https://www.google.com/search?q=test", "Safe - Google"),
    ("https://bit.ly/abc123", "Suspicious - URL shortener"),
]

print("=" * 80)
print("COMPREHENSIVE URL FLAG ANALYSIS TEST (40 RED + 40 GREEN FLAGS)")
print("=" * 80)

for url, description in test_cases:
    print(f"\n{'='*80}")
    print(f"URL: {url}")
    print(f"Description: {description}")
    print(f"{'='*80}")
    
    result = extractor.analyze_url_comprehensively(url)
    
    print(f"\n📊 SUMMARY:")
    print(f"  Red Flags: {result['red_flag_count']}/40")
    print(f"  Green Flags: {result['green_flag_count']}/40")
    print(f"  Risk Score: {result['risk_score']}%")
    print(f"  Verdict: {'⚠️ SUSPICIOUS' if result['red_flag_count'] >= 5 else '✅ SAFE'}")
    
    if result['red_flag_count'] > 0:
        print(f"\n🔴 RED FLAGS DETECTED ({result['red_flag_count']}):")
        for flag in result['red_flags_list'][:10]:  # Show first 10
            print(f"    • {flag}")
    
    if result['green_flag_count'] > 0:
        print(f"\n🟢 GREEN FLAGS DETECTED ({result['green_flag_count']}):")
        for flag in result['green_flags_list'][:10]:  # Show first 10
            print(f"    • {flag}")

print("\n" + "=" * 80)
print("TEST COMPLETE")
print("=" * 80)
