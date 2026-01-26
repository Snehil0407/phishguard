import re

text = "CONGRATULATIONS! You've won a $1000 Walmart gift card. Claim now: bit.ly/prize123"

print(f"Text: {text}\n")

# Test current regex
all_caps_words = re.findall(r'\b[A-Z]{4,}\b', text)
print(f'All caps words (4+ letters): {all_caps_words}')
print(f'Count: {len(all_caps_words)}')

# Find all words that are fully capitalized (including punctuation)
words = text.split()
caps_words = [w.strip('!.,?:;') for w in words if w.strip('!.,?:;').isupper() and len(w.strip('!.,?:;')) >= 2]
print(f'\nAll caps words (cleaned): {caps_words}')
print(f'Count: {len(caps_words)}')

# Check if >= 2 all caps words
has_multiple_caps = len(caps_words) >= 2
print(f'\nHas 2+ all-caps words: {has_multiple_caps}')

# Check exclamation marks
exclamation_count = text.count('!')
print(f'Exclamation marks: {exclamation_count}')
print(f'Excessive punctuation (>2): {exclamation_count > 2}')

