"""
Train Email Phishing Detection Models
Complete training pipeline for email classification
"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

import pandas as pd
import numpy as np
import pickle
import json
from datetime import datetime

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import (accuracy_score, precision_score, recall_score, 
                             f1_score, classification_report, confusion_matrix)

from ml.utils.data_loader import DatasetLoader
from ml.utils.text_preprocessing import TextPreprocessor, download_nltk_data
from scipy.sparse import hstack
import re


class EmailModelTrainer:
    """Train and evaluate email phishing detection models"""
    
    def __init__(self):
        """Initialize trainer"""
        self.preprocessor = TextPreprocessor(use_stemming=True, remove_stopwords=True)
        self.vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
        self.models = {}
        self.results = {}
        self.best_model = None
        self.best_model_name = None
        
        # Trusted domains for email features
        self.trusted_domains = [
            'google.com', 'gmail.com', 'yahoo.com', 'microsoft.com',
            'outlook.com', 'amazon.com', 'apple.com', 'paypal.com'
        ]
        
        # Free email providers
        self.free_email_providers = [
            'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
            'aol.com', 'mail.com', 'protonmail.com', 'yandex.com'
        ]
        
        # Suspicious TLDs
        self.suspicious_tlds = [
            '.xyz', '.top', '.club', '.work', '.click', '.link',
            '.stream', '.download', '.gq', '.ml', '.ga', '.cf', '.tk'
        ]
    
    def extract_email_features(self, sender_email):
        """Extract features from sender email address"""
        features = {}
        
        try:
            email = str(sender_email).lower().strip()
            
            # Extract domain
            if '@' in email:
                domain = email.split('@')[-1]
            else:
                domain = 'unknown'
            
            # Feature 1: Is trusted domain
            features['is_trusted_domain'] = int(domain in self.trusted_domains)
            
            # Feature 2: Is free email provider
            features['is_free_email'] = int(domain in self.free_email_providers)
            
            # Feature 3: Has suspicious TLD
            features['has_suspicious_tld'] = int(any(domain.endswith(tld) for tld in self.suspicious_tlds))
            
            # Feature 4: Domain length
            features['domain_length'] = len(domain)
            
            # Feature 5: Number of dots in domain
            features['domain_dots'] = domain.count('.')
            
            # Feature 6: Has numbers in domain
            features['domain_has_numbers'] = int(bool(re.search(r'\d', domain)))
            
            # Feature 7: Domain has hyphens
            features['domain_has_hyphens'] = int('-' in domain)
            
            # Feature 8: Username length (before @)
            username = email.split('@')[0] if '@' in email else ''
            features['username_length'] = len(username)
            
            # Feature 9: Username has numbers
            features['username_has_numbers'] = int(bool(re.search(r'\d', username)))
            
            # Feature 10: Username has special chars
            features['username_special_chars'] = int(bool(re.search(r'[^a-z0-9._-]', username)))
            
            # Feature 11: Suspicious patterns (noreply, admin, support without proper domain)
            suspicious_usernames = ['noreply', 'admin', 'support', 'info', 'alert', 'security']
            features['suspicious_username'] = int(
                any(sus in username for sus in suspicious_usernames) and 
                domain not in self.trusted_domains
            )
            
            # Feature 12: Email entropy (randomness indicator)
            features['email_entropy'] = self._calculate_entropy(email)
            
        except Exception as e:
            # Default features if extraction fails
            features = {
                'is_trusted_domain': 0, 'is_free_email': 0, 'has_suspicious_tld': 0,
                'domain_length': 0, 'domain_dots': 0, 'domain_has_numbers': 0,
                'domain_has_hyphens': 0, 'username_length': 0, 'username_has_numbers': 0,
                'username_special_chars': 0, 'suspicious_username': 0, 'email_entropy': 0
            }
        
        return list(features.values())
    
    def _calculate_entropy(self, text):
        """Calculate Shannon entropy of text"""
        import math
        if not text:
            return 0
        entropy = 0
        for char in set(text):
            p = text.count(char) / len(text)
            entropy -= p * math.log2(p)
        return entropy
    
    def preprocess_data(self, df):
        """Preprocess text data and extract email features"""
        print("\n🔄 Preprocessing text data...")
        df['processed_text'] = df['text'].apply(lambda x: self.preprocessor.preprocess(str(x)))
        
        print("\n📧 Extracting email features...")
        email_features = df['sender_email'].apply(self.extract_email_features)
        df['email_features'] = email_features
        print(f"  ✓ Extracted {len(email_features.iloc[0])} email features per sample")
        
        return df
    
    def train_and_evaluate(self, X_train, X_test, y_train, y_test):
        """Train multiple models and evaluate"""
        print("\n🚀 Training models...")
        
        # Define models
        models_to_train = {
            'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
            'XGBoost': XGBClassifier(n_estimators=100, random_state=42, eval_metric='logloss', n_jobs=-1),
            'Naive Bayes': MultinomialNB()
        }
        
        best_accuracy = 0
        
        for name, model in models_to_train.items():
            print(f"\n📊 Training {name}...")
            
            # Train model
            model.fit(X_train, y_train)
            
            # Predictions
            y_pred = model.predict(X_test)
            
            # Metrics
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, average='weighted')
            recall = recall_score(y_test, y_pred, average='weighted')
            f1 = f1_score(y_test, y_pred, average='weighted')
            
            # Cross-validation
            cv_scores = cross_val_score(model, X_train, y_train, cv=5)
            
            # Store results
            self.models[name] = model
            self.results[name] = {
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1_score': f1,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std(),
                'confusion_matrix': confusion_matrix(y_test, y_pred).tolist(),
                'classification_report': classification_report(y_test, y_pred)
            }
            
            print(f"  ✓ Accuracy: {accuracy:.4f}")
            print(f"  ✓ Precision: {precision:.4f}")
            print(f"  ✓ Recall: {recall:.4f}")
            print(f"  ✓ F1-Score: {f1:.4f}")
            print(f"  ✓ Cross-Val Score: {cv_scores.mean():.4f} (+/- {cv_scores.std():.4f})")
            
            # Track best model
            if accuracy > best_accuracy:
                best_accuracy = accuracy
                self.best_model = model
                self.best_model_name = name
        
        print(f"\n🏆 Best Model: {self.best_model_name} (Accuracy: {best_accuracy:.4f})")
    
    def save_models(self, save_dir):
        """Save trained models and vectorizer"""
        print(f"\n💾 Saving models to {save_dir}...")
        
        # Create directory if not exists
        import os
        os.makedirs(save_dir, exist_ok=True)
        
        # Save vectorizer
        with open(f"{save_dir}/email_vectorizer.pkl", 'wb') as f:
            pickle.dump(self.vectorizer, f)
        print("  ✓ Saved vectorizer")
        
        # Save best model
        with open(f"{save_dir}/email_model_best.pkl", 'wb') as f:
            pickle.dump(self.best_model, f)
        print(f"  ✓ Saved best model ({self.best_model_name})")
        
        # Save all models
        for name, model in self.models.items():
            safe_name = name.lower().replace(' ', '_')
            with open(f"{save_dir}/email_model_{safe_name}.pkl", 'wb') as f:
                pickle.dump(model, f)
        print(f"  ✓ Saved all {len(self.models)} models")
        
        # Save evaluation results
        with open(f"{save_dir}/email_evaluation_results.json", 'w') as f:
            results_to_save = {}
            for name, result in self.results.items():
                results_to_save[name] = {
                    k: v for k, v in result.items() 
                    if k != 'classification_report'
                }
            json.dump(results_to_save, f, indent=2)
        print("  ✓ Saved evaluation results")
        
        # Save detailed report
        with open(f"{save_dir}/email_training_report.txt", 'w') as f:
            f.write("=" * 70 + "\n")
            f.write("EMAIL PHISHING DETECTION - TRAINING REPORT\n")
            f.write("=" * 70 + "\n\n")
            f.write(f"Training Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Best Model: {self.best_model_name}\n\n")
            
            for name, result in self.results.items():
                f.write(f"\n{name}\n")
                f.write("-" * 50 + "\n")
                f.write(f"Accuracy:  {result['accuracy']:.4f}\n")
                f.write(f"Precision: {result['precision']:.4f}\n")
                f.write(f"Recall:    {result['recall']:.4f}\n")
                f.write(f"F1-Score:  {result['f1_score']:.4f}\n")
                f.write(f"CV Score:  {result['cv_mean']:.4f} (+/- {result['cv_std']:.4f})\n\n")
                f.write("Classification Report:\n")
                f.write(result['classification_report'])
                f.write("\n")
        
        print("  ✓ Saved detailed training report")
        print(f"\n✅ All files saved successfully!")


def main():
    """Main training pipeline"""
    print("=" * 70)
    print("EMAIL PHISHING DETECTION - MODEL TRAINING")
    print("=" * 70)
    
    # Download NLTK data
    download_nltk_data()
    
    # Load data
    loader = DatasetLoader()
    df = loader.load_email_data()
    
    if df is None or len(df) == 0:
        print("❌ No data loaded. Exiting...")
        return
    
    # Initialize trainer
    trainer = EmailModelTrainer()
    
    # Preprocess
    df = trainer.preprocess_data(df)
    
    # Prepare data
    print("\n📊 Preparing training data...")
    X_text = df['processed_text']
    X_email_features = np.array(df['email_features'].tolist())
    y = df['label']
    
    # Vectorize text
    print("  Converting text to TF-IDF vectors...")
    X_text_vectorized = trainer.vectorizer.fit_transform(X_text)
    print(f"  ✓ Text feature matrix shape: {X_text_vectorized.shape}")
    print(f"  ✓ Email feature matrix shape: {X_email_features.shape}")
    
    # Combine text features with email features
    print("  Combining text and email features...")
    X_combined = hstack([X_text_vectorized, X_email_features])
    print(f"  ✓ Combined feature matrix shape: {X_combined.shape}")
    print(f"  ✓ Total features: {X_combined.shape[1]} (TF-IDF: {X_text_vectorized.shape[1]}, Email: {X_email_features.shape[1]})")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_combined, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"  ✓ Training set: {X_train.shape[0]} samples")
    print(f"  ✓ Test set: {X_test.shape[0]} samples")
    
    # Train and evaluate
    trainer.train_and_evaluate(X_train, X_test, y_train, y_test)
    
    # Save models
    save_dir = "d:/Christ University/PG/6th trimester/phishguard/ml/models"
    trainer.save_models(save_dir)
    
    print("\n" + "=" * 70)
    print("✅ EMAIL MODEL TRAINING COMPLETED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    main()
