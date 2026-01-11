"""
Text preprocessing utilities for PhishGuard ML models
"""
import re
import string
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer, WordNetLemmatizer

# Download required NLTK data
def download_nltk_data():
    """Download required NLTK datasets"""
    try:
        nltk.download('punkt', quiet=True)
        nltk.download('stopwords', quiet=True)
        nltk.download('wordnet', quiet=True)
        nltk.download('averaged_perceptron_tagger', quiet=True)
        print("✓ NLTK data downloaded successfully")
    except Exception as e:
        print(f"⚠ Warning: Could not download NLTK data: {e}")

class TextPreprocessor:
    """Text preprocessing class for cleaning and normalizing text"""
    
    def __init__(self, use_stemming=True, use_lemmatization=False, remove_stopwords=True):
        """
        Initialize the preprocessor
        
        Args:
            use_stemming: Whether to apply stemming
            use_lemmatization: Whether to apply lemmatization
            remove_stopwords: Whether to remove stopwords
        """
        self.use_stemming = use_stemming
        self.use_lemmatization = use_lemmatization
        self.remove_stopwords = remove_stopwords
        
        # Initialize tools
        self.stemmer = PorterStemmer() if use_stemming else None
        self.lemmatizer = WordNetLemmatizer() if use_lemmatization else None
        self.stop_words = set(stopwords.words('english')) if remove_stopwords else set()
        
        # Common phishing keywords
        self.phishing_keywords = [
            'urgent', 'verify', 'account', 'suspended', 'confirm', 'password',
            'click', 'link', 'winner', 'prize', 'congratulations', 'free',
            'limited', 'expire', 'update', 'security', 'alert', 'warning',
            'bank', 'credit', 'card', 'paypal', 'amazon', 'apple', 'microsoft',
            'login', 'signin', 'verification', 'suspended', 'locked', 'unusual'
        ]
    
    def clean_text(self, text):
        """
        Clean and normalize text
        
        Args:
            text: Input text string
            
        Returns:
            Cleaned text string
        """
        if not isinstance(text, str):
            return ""
        
        # Convert to lowercase
        text = text.lower()
        
        # Remove URLs (keep for URL feature extraction later)
        # text = re.sub(r'http\S+|www\.\S+', '', text)
        
        # Remove email addresses
        text = re.sub(r'\S+@\S+', 'emailaddr', text)
        
        # Remove numbers but keep them for certain features
        text = re.sub(r'\d+', 'number', text)
        
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep some punctuation
        text = re.sub(r'[^\w\s.,!?]', '', text)
        
        return text.strip()
    
    def tokenize(self, text):
        """
        Tokenize text into words
        
        Args:
            text: Input text string
            
        Returns:
            List of tokens
        """
        try:
            tokens = word_tokenize(text)
        except:
            # Fallback to simple split if tokenization fails
            tokens = text.split()
        
        return tokens
    
    def remove_stopwords_from_tokens(self, tokens):
        """
        Remove stopwords from token list
        
        Args:
            tokens: List of tokens
            
        Returns:
            List of tokens without stopwords
        """
        if not self.remove_stopwords:
            return tokens
        
        return [token for token in tokens if token not in self.stop_words]
    
    def stem_tokens(self, tokens):
        """
        Apply stemming to tokens
        
        Args:
            tokens: List of tokens
            
        Returns:
            List of stemmed tokens
        """
        if not self.use_stemming or not self.stemmer:
            return tokens
        
        return [self.stemmer.stem(token) for token in tokens]
    
    def lemmatize_tokens(self, tokens):
        """
        Apply lemmatization to tokens
        
        Args:
            tokens: List of tokens
            
        Returns:
            List of lemmatized tokens
        """
        if not self.use_lemmatization or not self.lemmatizer:
            return tokens
        
        return [self.lemmatizer.lemmatize(token) for token in tokens]
    
    def preprocess(self, text):
        """
        Complete preprocessing pipeline
        
        Args:
            text: Input text string
            
        Returns:
            Preprocessed text string
        """
        # Clean text
        text = self.clean_text(text)
        
        # Tokenize
        tokens = self.tokenize(text)
        
        # Remove stopwords
        tokens = self.remove_stopwords_from_tokens(tokens)
        
        # Apply stemming or lemmatization
        if self.use_stemming:
            tokens = self.stem_tokens(tokens)
        elif self.use_lemmatization:
            tokens = self.lemmatize_tokens(tokens)
        
        # Join tokens back to string
        return ' '.join(tokens)
    
    def extract_urls(self, text):
        """
        Extract URLs from text
        
        Args:
            text: Input text string
            
        Returns:
            List of URLs found in text
        """
        url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        urls = re.findall(url_pattern, text)
        return urls
    
    def count_phishing_keywords(self, text):
        """
        Count phishing-related keywords in text
        
        Args:
            text: Input text string
            
        Returns:
            Number of phishing keywords found
        """
        text_lower = text.lower()
        count = sum(1 for keyword in self.phishing_keywords if keyword in text_lower)
        return count
    
    def get_text_statistics(self, text):
        """
        Extract various text statistics
        
        Args:
            text: Input text string
            
        Returns:
            Dictionary of text statistics
        """
        return {
            'length': len(text),
            'word_count': len(text.split()),
            'uppercase_ratio': sum(1 for c in text if c.isupper()) / len(text) if len(text) > 0 else 0,
            'digit_count': sum(1 for c in text if c.isdigit()),
            'special_char_count': sum(1 for c in text if c in string.punctuation),
            'url_count': len(self.extract_urls(text)),
            'phishing_keyword_count': self.count_phishing_keywords(text)
        }


if __name__ == "__main__":
    # Test the preprocessor
    download_nltk_data()
    
    preprocessor = TextPreprocessor()
    
    test_text = "URGENT! Your account has been SUSPENDED. Click here to verify: http://fake-site.com"
    print("Original:", test_text)
    print("Cleaned:", preprocessor.preprocess(test_text))
    print("Stats:", preprocessor.get_text_statistics(test_text))
