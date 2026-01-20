"""
Train SMS Phishing Detection Models
Complete training pipeline for SMS classification
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


class SMSModelTrainer:
    """Train and evaluate SMS phishing detection models"""
    
    def __init__(self):
        """Initialize trainer"""
        self.preprocessor = TextPreprocessor(use_stemming=True, remove_stopwords=True)
        self.vectorizer = TfidfVectorizer(max_features=3000, ngram_range=(1, 2))
        self.models = {}
        self.results = {}
        self.best_model = None
        self.best_model_name = None
    
    def preprocess_data(self, df):
        """Preprocess text data"""
        print("\n🔄 Preprocessing SMS data...")
        df['processed_text'] = df['text'].apply(lambda x: self.preprocessor.preprocess(str(x)))
        return df
    
    def train_and_evaluate(self, X_train, X_test, y_train, y_test):
        """Train multiple models and evaluate"""
        print("\n🚀 Training SMS models...")
        
        models_to_train = {
            'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
            'XGBoost': XGBClassifier(n_estimators=100, random_state=42, eval_metric='logloss', n_jobs=-1),
            'Naive Bayes': MultinomialNB()
        }
        
        best_accuracy = 0
        
        for name, model in models_to_train.items():
            print(f"\n📊 Training {name}...")
            
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            
            accuracy = accuracy_score(y_test, y_pred)
            precision = precision_score(y_test, y_pred, average='weighted')
            recall = recall_score(y_test, y_pred, average='weighted')
            f1 = f1_score(y_test, y_pred, average='weighted')
            cv_scores = cross_val_score(model, X_train, y_train, cv=5)
            
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
            
            if accuracy > best_accuracy:
                best_accuracy = accuracy
                self.best_model = model
                self.best_model_name = name
        
        print(f"\n🏆 Best Model: {self.best_model_name} (Accuracy: {best_accuracy:.4f})")
    
    def save_models(self, save_dir):
        """Save trained models"""
        print(f"\n💾 Saving SMS models to {save_dir}...")
        
        import os
        os.makedirs(save_dir, exist_ok=True)
        
        with open(f"{save_dir}/sms_vectorizer.pkl", 'wb') as f:
            pickle.dump(self.vectorizer, f)
        
        with open(f"{save_dir}/sms_model_best.pkl", 'wb') as f:
            pickle.dump(self.best_model, f)
        
        for name, model in self.models.items():
            safe_name = name.lower().replace(' ', '_')
            with open(f"{save_dir}/sms_model_{safe_name}.pkl", 'wb') as f:
                pickle.dump(model, f)
        
        with open(f"{save_dir}/sms_evaluation_results.json", 'w') as f:
            results_to_save = {}
            for name, result in self.results.items():
                results_to_save[name] = {
                    k: v for k, v in result.items() 
                    if k != 'classification_report'
                }
            json.dump(results_to_save, f, indent=2)
        
        with open(f"{save_dir}/sms_training_report.txt", 'w') as f:
            f.write("=" * 70 + "\n")
            f.write("SMS PHISHING DETECTION - TRAINING REPORT\n")
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
        
        print("✅ All SMS models saved successfully!")


def main():
    """Main training pipeline"""
    print("=" * 70)
    print("SMS PHISHING DETECTION - MODEL TRAINING")
    print("=" * 70)
    
    download_nltk_data()
    
    loader = DatasetLoader()
    df = loader.load_sms_data()
    
    if df is None or len(df) == 0:
        print("❌ No SMS data loaded. Exiting...")
        return
    
    trainer = SMSModelTrainer()
    df = trainer.preprocess_data(df)
    
    print("\n📊 Preparing training data...")
    X = df['processed_text']
    y = df['label']
    
    X_vectorized = trainer.vectorizer.fit_transform(X)
    print(f"  ✓ Feature matrix shape: {X_vectorized.shape}")
    
    X_train, X_test, y_train, y_test = train_test_split(
        X_vectorized, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"  ✓ Training set: {X_train.shape[0]} samples")
    print(f"  ✓ Test set: {X_test.shape[0]} samples")
    
    trainer.train_and_evaluate(X_train, X_test, y_train, y_test)
    
    save_dir = "d:/Christ University/PG/6th trimester/phishguard/ml/models"
    trainer.save_models(save_dir)
    
    print("\n" + "=" * 70)
    print("✅ SMS MODEL TRAINING COMPLETED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    main()
