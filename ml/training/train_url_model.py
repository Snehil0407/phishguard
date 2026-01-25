"""
Train URL Phishing Detection Models
Complete training pipeline for URL classification
"""
import sys
from pathlib import Path

# Add project root to path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

import pandas as pd
import numpy as np
import pickle
import json
from datetime import datetime

from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from xgboost import XGBClassifier
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.metrics import (accuracy_score, precision_score, recall_score, 
                             f1_score, classification_report, confusion_matrix)

from ml.utils.data_loader import DatasetLoader
from ml.utils.url_features import URLFeatureExtractor


class URLModelTrainer:
    """Train and evaluate URL phishing detection models"""
    
    def __init__(self):
        """Initialize trainer"""
        self.feature_extractor = URLFeatureExtractor()
        self.scaler = StandardScaler()
        self.models = {}
        self.results = {}
        self.best_model = None
        self.best_model_name = None
        self.feature_names = None
    
    def extract_features(self, df):
        """Extract features from URLs"""
        print("\n🔄 Extracting URL features...")
        
        features_list = []
        for idx, url in enumerate(df['url']):
            if idx % 10000 == 0:
                print(f"  Processing: {idx}/{len(df)}", end='\r')
            
            features = self.feature_extractor.extract_all_features(str(url))
            features_list.append(features)
        
        print(f"  ✓ Processed: {len(df)}/{len(df)}")
        
        # Convert to DataFrame
        features_df = pd.DataFrame(features_list)
        self.feature_names = list(features_df.columns)
        
        return features_df
    
    def train_and_evaluate(self, X_train, X_test, y_train, y_test):
        """Train multiple models and evaluate"""
        print("\n🚀 Training URL models...")
        
        models_to_train = {
            'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
            'XGBoost': XGBClassifier(n_estimators=100, random_state=42, eval_metric='logloss', n_jobs=-1),
            'Gradient Boosting': GradientBoostingClassifier(n_estimators=100, random_state=42)
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
            
            # Cross-validation (use smaller cv for large datasets)
            print("  Running cross-validation...")
            cv_scores = cross_val_score(model, X_train, y_train, cv=3)
            
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
        print(f"\n💾 Saving URL models to {save_dir}...")
        
        import os
        os.makedirs(save_dir, exist_ok=True)
        
        # Save scaler
        with open(f"{save_dir}/url_scaler.pkl", 'wb') as f:
            pickle.dump(self.scaler, f)
        
        # Save feature extractor
        with open(f"{save_dir}/url_feature_extractor.pkl", 'wb') as f:
            pickle.dump(self.feature_extractor, f)
        
        # Save best model
        with open(f"{save_dir}/url_model_best.pkl", 'wb') as f:
            pickle.dump(self.best_model, f)
        
        # Save all models
        for name, model in self.models.items():
            safe_name = name.lower().replace(' ', '_')
            with open(f"{save_dir}/url_model_{safe_name}.pkl", 'wb') as f:
                pickle.dump(model, f)
        
        # Save feature names
        with open(f"{save_dir}/url_feature_names.json", 'w') as f:
            json.dump(self.feature_names, f, indent=2)
        
        # Save evaluation results
        with open(f"{save_dir}/url_evaluation_results.json", 'w') as f:
            results_to_save = {}
            for name, result in self.results.items():
                results_to_save[name] = {
                    k: v for k, v in result.items() 
                    if k != 'classification_report'
                }
            json.dump(results_to_save, f, indent=2)
        
        # Save detailed report
        with open(f"{save_dir}/url_training_report.txt", 'w') as f:
            f.write("=" * 70 + "\n")
            f.write("URL PHISHING DETECTION - TRAINING REPORT\n")
            f.write("=" * 70 + "\n\n")
            f.write(f"Training Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"Best Model: {self.best_model_name}\n")
            f.write(f"Number of Features: {len(self.feature_names)}\n")
            f.write(f"Features: {', '.join(self.feature_names)}\n\n")
            
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
        
        print("✅ All URL models saved successfully!")


def main():
    """Main training pipeline"""
    print("=" * 70)
    print("URL PHISHING DETECTION - MODEL TRAINING")
    print("=" * 70)
    
    loader = DatasetLoader()
    df = loader.load_url_data()
    
    if df is None or len(df) == 0:
        print("❌ No URL data loaded. Exiting...")
        return
    
    trainer = URLModelTrainer()
    
    # Extract features
    features_df = trainer.extract_features(df)
    
    print("\n📊 Preparing training data...")
    X = features_df.values
    y = df['label'].values
    
    # Scale features
    print("  Scaling features...")
    X_scaled = trainer.scaler.fit_transform(X)
    print(f"  ✓ Feature matrix shape: {X_scaled.shape}")
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"  ✓ Training set: {X_train.shape[0]} samples")
    print(f"  ✓ Test set: {X_test.shape[0]} samples")
    
    # Train and evaluate
    trainer.train_and_evaluate(X_train, X_test, y_train, y_test)
    
    # Save models
    save_dir = "d:/Christ University/PG/6th trimester/phishguard/ml/models"
    trainer.save_models(save_dir)
    
    print("\n" + "=" * 70)
    print("✅ URL MODEL TRAINING COMPLETED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    main()
