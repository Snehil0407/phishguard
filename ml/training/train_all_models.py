"""
Master Training Script
Train all PhishGuard ML models (Email, SMS, URL)
"""
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

import subprocess
import time
from datetime import datetime


def run_training_script(script_name, description):
    """Run a training script and report results"""
    print("\n" + "=" * 70)
    print(f"🚀 Starting: {description}")
    print("=" * 70)
    
    start_time = time.time()
    
    try:
        result = subprocess.run(
            [sys.executable, script_name],
            cwd=Path(__file__).parent,
            capture_output=False,
            text=True
        )
        
        elapsed = time.time() - start_time
        
        if result.returncode == 0:
            print(f"\n✅ {description} completed successfully!")
            print(f"⏱ Time taken: {elapsed:.2f} seconds")
            return True
        else:
            print(f"\n❌ {description} failed with return code {result.returncode}")
            return False
    
    except Exception as e:
        print(f"\n❌ Error running {description}: {e}")
        return False


def main():
    """Main function to train all models"""
    print("\n" + "=" * 70)
    print("     PHISHGUARD ML MODEL TRAINING - MASTER SCRIPT")
    print("=" * 70)
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    total_start = time.time()
    results = {}
    
    # Train Email Model
    results['email'] = run_training_script(
        'train_email_model.py',
        'Email Phishing Detection Model Training'
    )
    
    # Train SMS Model
    results['sms'] = run_training_script(
        'train_sms_model.py',
        'SMS Phishing Detection Model Training'
    )
    
    # Train URL Model
    results['url'] = run_training_script(
        'train_url_model.py',
        'URL Phishing Detection Model Training'
    )
    
    # Summary
    total_elapsed = time.time() - total_start
    
    print("\n" + "=" * 70)
    print("                    TRAINING SUMMARY")
    print("=" * 70)
    
    for model_type, success in results.items():
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"{model_type.upper():15s}: {status}")
    
    print("=" * 70)
    print(f"Total time: {total_elapsed / 60:.2f} minutes")
    print(f"Completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)
    
    # Check if all succeeded
    if all(results.values()):
        print("\n🎉 ALL MODELS TRAINED SUCCESSFULLY!")
        print("Models saved in: d:/Christ University/PG/6th trimester/phishguard/ml/models")
    else:
        print("\n⚠ Some models failed to train. Check the logs above.")
    
    return all(results.values())


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
