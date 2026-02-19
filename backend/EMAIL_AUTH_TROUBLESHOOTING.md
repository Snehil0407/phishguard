# Email Authentication Troubleshooting Guide

## 🚨 "Authentication Failed" Error? Start Here!

This guide will help you fix authentication issues when connecting your email to PhishGuard.

---

## Step 1: Verify You're Using an App Password

### ❌ WRONG: Regular Email Password
```
Email: john@gmail.com
Password: myGmailPassword123  ← This won't work!
```

### ✅ CORRECT: App-Specific Password
```
Email: john@gmail.com
Password: abcd efgh ijkl mnop  ← 16-character app password
```

**Why?** Email providers block regular passwords from third-party apps for security. You MUST use an app-specific password.

---

## Step 2: Generate App Password (Choose Your Provider)

### Gmail Users

1. **Enable 2FA First** (Required!)
   - Go to: https://myaccount.google.com/security
   - Find "2-Step Verification" → Turn it on
   - Complete the setup process

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - ⚠️ If you don't see this option, 2FA isn't enabled yet
   - Select "App" → Choose "Mail"
   - Select device or choose "Other" → Type "PhishGuard"
   - Click **Generate**
   - Copy the 16-character password shown (spaces are ok!)

3. **Enable IMAP**
   - Open Gmail → Settings (gear icon) → "See all settings"
   - Go to "Forwarding and POP/IMAP" tab
   - Select "Enable IMAP"
   - Click "Save Changes"

### Outlook/Hotmail Users

1. **Enable 2FA First**
   - Go to: https://account.microsoft.com/security
   - Click "Advanced security options"
   - Under "Two-step verification" → Turn it on

2. **Generate App Password**
   - Still at: https://account.microsoft.com/security
   - Under "App passwords" → Create a new app password
   - Name it "PhishGuard"
   - Copy the password shown

### Yahoo Users

1. **Enable 2FA First**
   - Go to: https://login.yahoo.com/account/security
   - Under "Two-step verification" → Turn it on

2. **Generate App Password**
   - Still at: https://login.yahoo.com/account/security
   - Scroll to "App passwords" section
   - Click "Generate app password"
   - Select "Other App" → Type "PhishGuard"
   - Click "Generate"
   - Copy the password

3. **Enable IMAP** (if needed)
   - Yahoo Mail → Settings → "More Settings"
   - "Security and Privacy" → Enable IMAP

---

## Step 3: Common Mistakes & How to Fix Them

### Issue #1: Spaces in Password
**Symptom**: Authentication fails even with correct app password

**Solution**: PhishGuard automatically removes spaces - just paste the password as-is from your email provider!

Example:
```
App password from Gmail: abcd efgh ijkl mnop
What to paste: abcd efgh ijkl mnop
(we'll clean it to: abcdefghijklmnop automatically)
```

### Issue #2: 2FA Not Enabled
**Symptom**: Can't find app password option

**Solution**: 
1. Enable 2-Factor Authentication FIRST
2. Wait 5 minutes for settings to sync
3. Then generate app password

### Issue #3: Using Old/Revoked Password
**Symptom**: App password worked before but now fails

**Solution**:
1. Check if you revoked the app password accidentally
2. Generate a BRAND NEW app password
3. Delete the old one from your email settings
4. Use the new one in PhishGuard

### Issue #4: IMAP Disabled
**Symptom**: "Connection refused" or "IMAP not available"

**Solution**:
- **Gmail**: Enable in Settings → Forwarding and POP/IMAP
- **Outlook**: Already enabled by default ✅
- **Yahoo**: Enable in Settings → Security → IMAP Access

### Issue #5: Wrong Provider Selected
**Symptom**: Connection fails immediately

**Solution**: Make sure the provider matches your email:
- `@gmail.com` → Select **Gmail**
- `@outlook.com` or `@hotmail.com` → Select **Outlook**
- `@yahoo.com` → Select **Yahoo**
- `@icloud.com` → Select **iCloud**

---

## Step 4: Test Your Connection

### Method 1: Test in PhishGuard UI
1. Go to Email Monitoring page
2. Enter your email and app password
3. Click "Validate & Connect"
4. Watch for success message or detailed error

### Method 2: Test with Backend API
```bash
curl -X POST http://localhost:8000/api/email/validate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test",
    "email_address": "YOUR_EMAIL@gmail.com",
    "password": "YOUR_APP_PASSWORD_NO_SPACES"
  }'
```

**Success Response:**
```json
{
  "success": true,
  "message": "Successfully validated credentials for YOUR_EMAIL@gmail.com",
  "data": {
    "email": "YOUR_EMAIL@gmail.com",
    "provider": {"host": "imap.gmail.com", "port": 993}
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Gmail Authentication Failed. Common solutions:\n1. Generate App Password: https://myaccount.google.com/apppasswords\n..."
}
```

---

## Step 5: Still Not Working? Advanced Troubleshooting

### Check Backend Logs
```bash
cd backend
python main.py
```

Watch for log messages:
- `✅ Successfully validated credentials` = Working!
- `❌ Gmail Authentication Failed` = App password issue
- `❌ Connection error` = Network/firewall issue

### Verify Packages Installed
```bash
pip list | grep imapclient
```
Should show: `imapclient` version 3.1.0 or newer

### Test IMAP Manually (Python)
```python
import imaplib

# Test connection
mail = imaplib.IMAP4_SSL('imap.gmail.com', 993)
print("✅ Connected to server")

# Test login
mail.login('your-email@gmail.com', 'your-app-password-no-spaces')
print("✅ Authentication successful!")

# Test mailbox access
mail.select('INBOX')
print("✅ Mailbox access successful!")

mail.logout()
print("✅ All tests passed!")
```

If this Python code works but PhishGuard doesn't, there may be a configuration issue.

### Check Firewall/Network
- Ensure port 993 (IMAP SSL) is not blocked
- Try disabling antivirus temporarily
- Check if corporate firewall is blocking IMAP
- Try from different network (home vs office)

### Wait for App Password to Activate
- Sometimes app passwords take 1-5 minutes to activate
- Generate a new one and wait 5 minutes
- Then try again

---

## Error Messages Explained

### "AUTHENTICATIONFAILED"
**Meaning**: Email server rejected your credentials
**Fix**: Generate NEW app password, verify 2FA is on

### "Invalid credentials"
**Meaning**: Email or password is wrong
**Fix**: Double-check email address, regenerate app password

### "Connection refused"
**Meaning**: Can't reach email server
**Fix**: Check internet connection, verify IMAP port 993 is open

### "IMAP not enabled"
**Meaning**: IMAP access is turned off
**Fix**: Enable IMAP in your email settings

---

## Quick Reference Table

| Email Provider | 2FA Setup | App Password | IMAP Setup |
|---------------|-----------|--------------|------------|
| **Gmail** | [Link](https://myaccount.google.com/security) | [Link](https://myaccount.google.com/apppasswords) | Settings → Forwarding and POP/IMAP |
| **Outlook** | [Link](https://account.microsoft.com/security) | Same page → App passwords | Already enabled ✅ |
| **Yahoo** | [Link](https://login.yahoo.com/account/security) | Same page → App passwords | Settings → Security → IMAP |
| **iCloud** | Apple ID → Security | Same section → App passwords | Already enabled ✅ |

---

## Security FAQ

**Q: Is it safe to use app passwords?**
A: Yes! App passwords are MORE secure than regular passwords because:
- They only work for one app (PhishGuard)
- They can be revoked anytime without changing your main password
- If compromised, attacker can't access your full account

**Q: What does PhishGuard store?**
A: We store:
- ✅ Your email address (to monitor)
- ✅ Analysis results (phishing detections)
- ❌ NOT your password (never stored anywhere!)

**Q: Can PhishGuard read all my emails?**
A: PhishGuard only:
- Reads subject, sender, and body text
- Analyzes for phishing indicators
- Does NOT store email content
- Does NOT access attachments permanently

---

## Still Need Help?

1. **Check detailed documentation**:
   - `EMAIL_MONITORING_GUIDE.md` - Full setup guide
   - `TESTING_GUIDE.md` - Complete testing procedures

2. **Review API documentation**:
   - http://localhost:8000/docs - Interactive API docs
   - See all endpoints and test them directly

3. **Check backend logs**:
   - Run `python main.py` in backend directory
   - Watch for detailed error messages

4. **Try a fresh start**:
   - Generate brand new app password
   - Clear browser cache
   - Restart backend server
   - Try connection again

---

## Success Checklist ✅

Before connecting, verify:
- [ ] 2-Factor Authentication is **enabled** on your email
- [ ] You've generated a **new** app-specific password (within last 24 hours)
- [ ] IMAP is **enabled** in your email settings (Gmail/Yahoo)
- [ ] You're using the **app password**, not your regular password
- [ ] You've **copied the entire password** (including spaces if any)
- [ ] Backend server is **running** on port 8000
- [ ] Frontend is **running** on port 5176
- [ ] You've selected the **correct provider** in the dropdown

Once all checked: **Try connecting again!** 🚀

---

**Last Updated**: February 12, 2026
**PhishGuard Version**: 1.0.0
