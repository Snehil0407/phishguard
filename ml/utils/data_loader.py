"""
Dataset loading utilities for PhishGuard ML models
"""
import pandas as pd
import os

class DatasetLoader:
    """Load and prepare datasets for training"""
    
    def __init__(self):
        """Initialize dataset loader"""
        self.base_path = "d:/Christ University/PG/6th trimester/phishguard/ml/datasets"
    
    def load_email_data(self):
        """Load and combine all email datasets with subject + body"""
        print("\n📧 Loading email datasets...")
        
        email_dir = os.path.join(self.base_path, 'email', 'legitimate and phishing')
        all_data = []
        
        try:
            # Load PhishingEmailData.csv
            df1 = pd.read_csv(os.path.join(email_dir, 'PhishingEmailData.csv'), 
                             encoding='latin-1', on_bad_lines='skip')
            if 'Email_Content' in df1.columns:
                df1 = df1[['Email_Content']].copy()
                df1['label'] = 1  # 1 for phishing
                df1.rename(columns={'Email_Content': 'text'}, inplace=True)
                all_data.append(df1)
                print(f"  ✓ PhishingEmailData.csv: {len(df1)} samples (phishing)")
        except Exception as e:
            print(f"  ⚠ Could not load PhishingEmailData.csv: {e}")
        
        try:
            # Load Enron (has subject and body columns)
            enron_df = pd.read_csv(os.path.join(email_dir, 'Enron.csv'),
                                  encoding='latin-1', on_bad_lines='skip', nrows=5000)
            if 'body' in enron_df.columns and 'label' in enron_df.columns:
                # Combine subject + body for better detection
                if 'subject' in enron_df.columns:
                    enron_df['text'] = enron_df['subject'].fillna('') + ' ' + enron_df['body'].fillna('')
                else:
                    enron_df['text'] = enron_df['body'].fillna('')
                enron_df = enron_df[['text', 'label']].copy()
                all_data.append(enron_df)
                print(f"  ✓ Enron.csv: {len(enron_df)} samples (with subject + body)")
        except Exception as e:
            print(f"  ⚠ Could not load Enron.csv: {e}")
        
        try:
            # Load SpamAssassin (has subject and body columns)
            spam_df = pd.read_csv(os.path.join(email_dir, 'SpamAssasin.csv'),
                                 encoding='latin-1', on_bad_lines='skip', nrows=5000)
            if 'body' in spam_df.columns and 'label' in spam_df.columns:
                # Combine subject + body for better detection
                if 'subject' in spam_df.columns:
                    spam_df['text'] = spam_df['subject'].fillna('') + ' ' + spam_df['body'].fillna('')
                else:
                    spam_df['text'] = spam_df['body'].fillna('')
                spam_df = spam_df[['text', 'label']].copy()
                all_data.append(spam_df)
                print(f"  ✓ SpamAssasin.csv: {len(spam_df)} samples (with subject + body)")
        except Exception as e:
            print(f"  ⚠ Could not load SpamAssasin.csv: {e}")
        
        # Combine all data
        if all_data:
            combined_df = pd.concat(all_data, ignore_index=True)
            combined_df = combined_df.dropna()
            combined_df = combined_df.sample(frac=1, random_state=42).reset_index(drop=True)
            print(f"✓ Total emails: {len(combined_df)}")
            print(f"  - Legitimate: {sum(combined_df['label'] == 0)}")
            print(f"  - Phishing/Spam: {sum(combined_df['label'] == 1)}")
            print("  - Training on: subject + body combined")
            return combined_df
        else:
            print("⚠ No email data loaded")
            return None
    
    def load_sms_data(self):
        """Load SMS dataset"""
        print("\n📱 Loading SMS dataset...")
        sms_path = os.path.join(self.base_path, 'sms', 'spam and legitimate.csv')
        
        try:
            df = pd.read_csv(sms_path, encoding='latin-1')
            df = df[['v1', 'v2']].copy()
            df.columns = ['label', 'text']
            df['label'] = (df['label'] == 'spam').astype(int)
            df = df.dropna()
            
            print(f"✓ SMS dataset: {len(df)} samples")
            print(f"  - Legitimate: {sum(df['label'] == 0)}")
            print(f"  - Phishing: {sum(df['label'] == 1)}")
            
            return df
        except Exception as e:
            print(f"✗ Error loading SMS data: {e}")
            return None
    
    def load_url_data(self):
        """Load and combine URL datasets"""
        print("\n🔗 Loading URL datasets...")
        
        try:
            # Load phishing URLs
            phishing_path = os.path.join(self.base_path, 'urls', 'phishing', 'phishing_site_urls.csv')
            phishing_df = pd.read_csv(phishing_path, nrows=50000)
            phishing_df = phishing_df.iloc[:, :2]
            phishing_df.columns = ['url', 'label']
            phishing_df['label'] = 1
            
            # Load legitimate URLs
            legit_path = os.path.join(self.base_path, 'urls', 'legitimate', 'legitimate.csv')
            legit_df = pd.read_csv(legit_path, header=None, names=['id', 'url'], nrows=50000)
            legit_df = legit_df[['url']].copy()
            legit_df['label'] = 0
            
            print(f"  ✓ Phishing URLs: {len(phishing_df)}")
            print(f"  ✓ Legitimate URLs: {len(legit_df)}")
            
            # Combine
            df = pd.concat([phishing_df, legit_df], ignore_index=True)
            df = df.dropna()
            
            # CRITICAL: Normalize URLs by adding https:// prefix if missing
            # This ensures consistency between training and prediction
            def normalize_url(url):
                url = str(url).strip()
                if not url.startswith(('http://', 'https://')):
                    # Add https:// prefix for legitimate domains
                    return 'https://' + url
                return url
            
            df['url'] = df['url'].apply(normalize_url)
            
            df = df.sample(frac=1, random_state=42).reset_index(drop=True)
            
            print(f"✓ Total URLs: {len(df)}")
            print(f"  - URLs normalized with https:// prefix")
            return df
        except Exception as e:
            print(f"✗ Error loading URL data: {e}")
            return None


if __name__ == "__main__":
    loader = DatasetLoader()
    
    print("=" * 60)
    print("Testing Dataset Loader")
    print("=" * 60)
    
    email_df = loader.load_email_data()
    sms_df = loader.load_sms_data()
    url_df = loader.load_url_data()
    
    print("\n✓ All datasets loaded successfully!")
