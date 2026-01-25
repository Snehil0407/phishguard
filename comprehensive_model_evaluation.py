"""
Comprehensive Model Evaluation and Conditional Retraining
Tests each model with 100 legitimate + 100 phishing samples
Retrains if new performance is better
"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent))

import pandas as pd
import numpy as np
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, confusion_matrix
from ml.predictor import get_predictor
from ml.utils.data_loader import DatasetLoader
import json
import time

class ModelEvaluator:
    """Evaluate models and decide if retraining is needed"""
    
    def __init__(self):
        self.predictor = get_predictor()
        self.loader = DatasetLoader()
        self.results = {}
        
    def evaluate_email_model(self):
        """Evaluate email model with 100 legit + 100 phishing"""
        print("\n" + "="*80)
        print("📧 EVALUATING EMAIL MODEL")
        print("="*80)
        
        # Load data
        df = self.loader.load_email_data()
        if df is None or len(df) == 0:
            print("❌ Could not load email data")
            return None
        
        # Get 100 legitimate and 100 phishing
        legit = df[df['label'] == 0].sample(n=min(100, len(df[df['label'] == 0])), random_state=42)
        phish = df[df['label'] == 1].sample(n=min(100, len(df[df['label'] == 1])), random_state=42)
        test_df = pd.concat([legit, phish]).sample(frac=1, random_state=42).reset_index(drop=True)
        
        print(f"Testing with {len(legit)} legitimate + {len(phish)} phishing emails")
        
        # Make predictions
        predictions = []
        true_labels = []
        start_time = time.time()
        
        for idx, row in test_df.iterrows():
            if (idx + 1) % 20 == 0:
                print(f"  Progress: {idx + 1}/{len(test_df)}...")
            
            result = self.predictor.predict_email(row['text'])
            predictions.append(1 if result['is_phishing'] else 0)
            true_labels.append(row['label'])
        
        elapsed_time = time.time() - start_time
        
        # Calculate metrics
        accuracy = accuracy_score(true_labels, predictions)
        precision = precision_score(true_labels, predictions)
        recall = recall_score(true_labels, predictions)
        f1 = f1_score(true_labels, predictions)
        cm = confusion_matrix(true_labels, predictions)
        
        # Calculate per-class accuracy
        tn, fp, fn, tp = cm.ravel()
        legit_accuracy = tn / (tn + fp) if (tn + fp) > 0 else 0
        phish_accuracy = tp / (tp + fn) if (tp + fn) > 0 else 0
        
        results = {
            'model_type': 'Email',
            'total_samples': len(test_df),
            'legitimate_samples': len(legit),
            'phishing_samples': len(phish),
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'legitimate_accuracy': legit_accuracy,
            'phishing_accuracy': phish_accuracy,
            'confusion_matrix': cm.tolist(),
            'true_negatives': int(tn),
            'false_positives': int(fp),
            'false_negatives': int(fn),
            'true_positives': int(tp),
            'avg_time_per_prediction': elapsed_time / len(test_df)
        }
        
        self._print_results(results)
        return results
    
    def evaluate_sms_model(self):
        """Evaluate SMS model with 100 legit + 100 phishing"""
        print("\n" + "="*80)
        print("📱 EVALUATING SMS MODEL")
        print("="*80)
        
        df = self.loader.load_sms_data()
        if df is None or len(df) == 0:
            print("❌ Could not load SMS data")
            return None
        
        legit = df[df['label'] == 0].sample(n=min(100, len(df[df['label'] == 0])), random_state=42)
        phish = df[df['label'] == 1].sample(n=min(100, len(df[df['label'] == 1])), random_state=42)
        test_df = pd.concat([legit, phish]).sample(frac=1, random_state=42).reset_index(drop=True)
        
        print(f"Testing with {len(legit)} legitimate + {len(phish)} phishing SMS")
        
        predictions = []
        true_labels = []
        start_time = time.time()
        
        for idx, row in test_df.iterrows():
            if (idx + 1) % 20 == 0:
                print(f"  Progress: {idx + 1}/{len(test_df)}...")
            
            result = self.predictor.predict_sms(row['text'])
            predictions.append(1 if result['is_phishing'] else 0)
            true_labels.append(row['label'])
        
        elapsed_time = time.time() - start_time
        
        accuracy = accuracy_score(true_labels, predictions)
        precision = precision_score(true_labels, predictions)
        recall = recall_score(true_labels, predictions)
        f1 = f1_score(true_labels, predictions)
        cm = confusion_matrix(true_labels, predictions)
        
        tn, fp, fn, tp = cm.ravel()
        legit_accuracy = tn / (tn + fp) if (tn + fp) > 0 else 0
        phish_accuracy = tp / (tp + fn) if (tp + fn) > 0 else 0
        
        results = {
            'model_type': 'SMS',
            'total_samples': len(test_df),
            'legitimate_samples': len(legit),
            'phishing_samples': len(phish),
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'legitimate_accuracy': legit_accuracy,
            'phishing_accuracy': phish_accuracy,
            'confusion_matrix': cm.tolist(),
            'true_negatives': int(tn),
            'false_positives': int(fp),
            'false_negatives': int(fn),
            'true_positives': int(tp),
            'avg_time_per_prediction': elapsed_time / len(test_df)
        }
        
        self._print_results(results)
        return results
    
    def evaluate_url_model(self):
        """Evaluate URL model with 100 legit + 100 phishing"""
        print("\n" + "="*80)
        print("🔗 EVALUATING URL MODEL")
        print("="*80)
        
        df = self.loader.load_url_data()
        if df is None or len(df) == 0:
            print("❌ Could not load URL data")
            return None
        
        legit = df[df['label'] == 0].sample(n=min(100, len(df[df['label'] == 0])), random_state=42)
        phish = df[df['label'] == 1].sample(n=min(100, len(df[df['label'] == 1])), random_state=42)
        test_df = pd.concat([legit, phish]).sample(frac=1, random_state=42).reset_index(drop=True)
        
        print(f"Testing with {len(legit)} legitimate + {len(phish)} phishing URLs")
        
        predictions = []
        true_labels = []
        start_time = time.time()
        
        for idx, row in test_df.iterrows():
            if (idx + 1) % 20 == 0:
                print(f"  Progress: {idx + 1}/{len(test_df)}...")
            
            result = self.predictor.predict_url(row['url'])
            predictions.append(1 if result['is_phishing'] else 0)
            true_labels.append(row['label'])
        
        elapsed_time = time.time() - start_time
        
        accuracy = accuracy_score(true_labels, predictions)
        precision = precision_score(true_labels, predictions)
        recall = recall_score(true_labels, predictions)
        f1 = f1_score(true_labels, predictions)
        cm = confusion_matrix(true_labels, predictions)
        
        tn, fp, fn, tp = cm.ravel()
        legit_accuracy = tn / (tn + fp) if (tn + fp) > 0 else 0
        phish_accuracy = tp / (tp + fn) if (tp + fn) > 0 else 0
        
        results = {
            'model_type': 'URL',
            'total_samples': len(test_df),
            'legitimate_samples': len(legit),
            'phishing_samples': len(phish),
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'legitimate_accuracy': legit_accuracy,
            'phishing_accuracy': phish_accuracy,
            'confusion_matrix': cm.tolist(),
            'true_negatives': int(tn),
            'false_positives': int(fp),
            'false_negatives': int(fn),
            'true_positives': int(tp),
            'avg_time_per_prediction': elapsed_time / len(test_df)
        }
        
        self._print_results(results)
        return results
    
    def _print_results(self, results):
        """Print evaluation results"""
        print(f"\n📊 {results['model_type']} Model Results:")
        print(f"{'='*60}")
        print(f"  Total Samples:       {results['total_samples']}")
        print(f"  Legitimate Samples:  {results['legitimate_samples']}")
        print(f"  Phishing Samples:    {results['phishing_samples']}")
        print(f"\n  Overall Accuracy:    {results['accuracy']:.2%}")
        print(f"  Precision:           {results['precision']:.2%}")
        print(f"  Recall:              {results['recall']:.2%}")
        print(f"  F1-Score:            {results['f1_score']:.2%}")
        print(f"\n  Legitimate Accuracy: {results['legitimate_accuracy']:.2%}")
        print(f"  Phishing Accuracy:   {results['phishing_accuracy']:.2%}")
        print(f"\n  Confusion Matrix:")
        print(f"    True Negatives:    {results['true_negatives']} (Correctly identified legitimate)")
        print(f"    False Positives:   {results['false_positives']} (Legitimate flagged as phishing)")
        print(f"    False Negatives:   {results['false_negatives']} (Phishing missed)")
        print(f"    True Positives:    {results['true_positives']} (Correctly identified phishing)")
        print(f"\n  Avg Time/Prediction: {results['avg_time_per_prediction']:.3f}s")
        print(f"{'='*60}")
    
    def load_previous_results(self):
        """Load previous evaluation results if they exist"""
        try:
            with open("d:/Christ University/PG/6th trimester/phishguard/ml/models/email_evaluation_results.json", 'r') as f:
                email_prev = json.load(f)
            with open("d:/Christ University/PG/6th trimester/phishguard/ml/models/sms_evaluation_results.json", 'r') as f:
                sms_prev = json.load(f)
            with open("d:/Christ University/PG/6th trimester/phishguard/ml/models/url_evaluation_results.json", 'r') as f:
                url_prev = json.load(f)
            
            # Extract XGBoost results (the best model)
            return {
                'email': email_prev.get('XGBoost', {}),
                'sms': sms_prev.get('XGBoost', {}),
                'url': url_prev.get('XGBoost', {})
            }
        except Exception as e:
            print(f"⚠ Could not load previous results: {e}")
            return None
    
    def compare_and_decide(self, current_results, previous_results):
        """Compare results and decide if retraining is needed"""
        print("\n" + "="*80)
        print("🔍 COMPARISON WITH PREVIOUS TRAINING")
        print("="*80)
        
        if previous_results is None:
            print("No previous results found. Recommending retraining.")
            return True
        
        decisions = {}
        
        for model_type in ['email', 'sms', 'url']:
            current = current_results.get(model_type)
            previous = previous_results.get(model_type)
            
            if current is None or previous is None:
                continue
            
            print(f"\n{model_type.upper()} Model:")
            print(f"  Previous Accuracy: {previous.get('accuracy', 0):.2%}")
            print(f"  Current Accuracy:  {current['accuracy']:.2%}")
            print(f"  Previous F1-Score: {previous.get('f1_score', 0):.2%}")
            print(f"  Current F1-Score:  {current['f1_score']:.2%}")
            
            # Decision: retrain if current is better
            current_score = (current['accuracy'] + current['f1_score']) / 2
            previous_score = (previous.get('accuracy', 0) + previous.get('f1_score', 0)) / 2
            
            if current_score > previous_score:
                print(f"  ✅ RECOMMEND RETRAINING (Score improved: {previous_score:.2%} → {current_score:.2%})")
                decisions[model_type] = True
            else:
                print(f"  ⏸️ KEEP CURRENT MODEL (Score maintained: {previous_score:.2%})")
                decisions[model_type] = False
        
        return decisions


def main():
    """Main evaluation pipeline"""
    print("="*80)
    print("COMPREHENSIVE MODEL EVALUATION")
    print("Testing each model with 100 legitimate + 100 phishing samples")
    print("="*80)
    
    evaluator = ModelEvaluator()
    
    # Evaluate all models
    email_results = evaluator.evaluate_email_model()
    sms_results = evaluator.evaluate_sms_model()
    url_results = evaluator.evaluate_url_model()
    
    current_results = {
        'email': email_results,
        'sms': sms_results,
        'url': url_results
    }
    
    # Load previous results
    previous_results = evaluator.load_previous_results()
    
    # Compare and decide
    decisions = evaluator.compare_and_decide(current_results, previous_results)
    
    # Summary
    print("\n" + "="*80)
    print("📋 FINAL RECOMMENDATIONS")
    print("="*80)
    
    if decisions:
        for model_type, should_retrain in decisions.items():
            if should_retrain:
                print(f"\n✅ {model_type.upper()} Model: RETRAIN RECOMMENDED")
                print(f"   Run: python ml/training/train_{model_type}_model.py")
            else:
                print(f"\n⏸️ {model_type.upper()} Model: KEEP CURRENT")
    else:
        print("\n⚠️ No valid comparison available")
    
    # Save results
    with open("d:/Christ University/PG/6th trimester/phishguard/evaluation_report.json", 'w') as f:
        json.dump({
            'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
            'current_results': current_results,
            'decisions': decisions if decisions else {}
        }, f, indent=2, default=str)
    
    print(f"\n💾 Detailed results saved to: evaluation_report.json")
    
    print("\n" + "="*80)
    print("✅ EVALUATION COMPLETE")
    print("="*80)


if __name__ == "__main__":
    main()
