# Firebase Email Configuration Guide - Prevent Spam Folder

## Overview
This guide helps you configure Firebase to send password reset emails that won't go to spam folders.

## Current Implementation

### ✅ Custom Password Reset Page
We've created a beautiful custom password reset page (`/reset-password`) that:
- Verifies the reset code from the email link
- Shows a professional, branded UI
- Validates password requirements in real-time
- Provides clear feedback to users
- Handles all error cases gracefully

### ✅ Custom Action URL
The `resetPassword` function now uses `actionCodeSettings` to redirect users to our custom page instead of Firebase's default page.

## Firebase Console Configuration Steps

### Step 1: Enable Custom Email Action Handler

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: **phishguard**
3. Navigate to **Authentication** → **Templates**
4. Click on **Password reset** template

### Step 2: Customize Email Template

#### Important Template Changes:

**Subject Line:**
```
Reset Your PhishGuard Password
```

**Email Body Template:**
```html
<p>Hello,</p>

<p>We received a request to reset your password for your PhishGuard account.</p>

<p>Click the button below to create a new password:</p>

<a href="%LINK%" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0;">Reset Password</a>

<p>Or copy and paste this link into your browser:</p>
<p style="word-break: break-all; color: #2563eb;">%LINK%</p>

<p><strong>This link will expire in 1 hour.</strong></p>

<p>If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.</p>

<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">

<p style="color: #6b7280; font-size: 14px;">
<strong>PhishGuard</strong> - Protecting you from phishing attacks<br>
This is an automated message, please do not reply to this email.
</p>
```

**Sender Name:**
```
PhishGuard Security
```

### Step 3: Configure Custom Domain (RECOMMENDED)

To significantly reduce spam detection:

1. Go to **Authentication** → **Settings** → **Email**
2. Click **Customize domain**
3. Set up custom SMTP settings if you have:
   - SendGrid account
   - AWS SES
   - Mailgun
   - Custom email server

**Example with SendGrid (Free tier available):**
```javascript
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
Username: apikey
Password: [Your SendGrid API Key]
From Email: noreply@yourdomain.com
From Name: PhishGuard Security
```

### Step 4: Add SPF and DKIM Records

If using custom domain, add these DNS records:

**SPF Record:**
```
Type: TXT
Host: @
Value: v=spf1 include:_spf.google.com include:sendgrid.net ~all
TTL: 3600
```

**DKIM Record:**
```
Type: TXT
Host: mail._domainkey
Value: [Provided by your email service]
TTL: 3600
```

**DMARC Record:**
```
Type: TXT
Host: _dmarc
Value: v=DMARC1; p=none; rua=mailto:admin@yourdomain.com
TTL: 3600
```

### Step 5: Enable Email Verification Settings

1. Go to **Authentication** → **Settings**
2. Under **User actions**, ensure:
   - ✅ Enable email verification
   - ✅ Require email verification for sensitive operations
   - ✅ Enable password reset

### Step 6: Configure Firebase Dynamic Links (Optional but Recommended)

1. Go to **Dynamic Links** in Firebase Console
2. Set up a custom domain (e.g., `link.phishguard.com`)
3. Update the action URL in AuthContext to use this domain

## Quick Fixes Without Custom Domain

If you can't set up a custom domain immediately, these changes will still help:

### 1. Update Email Template Wording
- Use professional, clear language
- Include company name consistently
- Add context about why they're receiving the email
- Mention security explicitly

### 2. Add Unsubscribe Link (Required by some email providers)
```html
<p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
Don't want to receive these emails? These are critical security notifications
and cannot be disabled. If you didn't create this account, please ignore this email.
</p>
```

### 3. Improve HTML Email Structure
```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <!-- Your email content here -->
</body>
</html>
```

## Testing Email Deliverability

### Mail-Tester.com
1. Send a test password reset to: test-xxxxx@mail-tester.com
2. Visit https://www.mail-tester.com/test-xxxxx
3. Check your spam score (aim for 8+/10)

### Common Issues and Fixes:

**Issue: "No SPF record found"**
- Solution: Add SPF record to DNS

**Issue: "Poor HTML structure"**
- Solution: Use proper HTML email template

**Issue: "Suspicious links"**
- Solution: Use custom domain for links

**Issue: "Sender domain mismatch"**
- Solution: Configure custom SMTP with your domain

## Firebase Email Limitations

### Free Tier (Spark Plan):
- ❌ Cannot use custom SMTP
- ❌ Cannot customize sender domain
- ✅ Can customize email templates
- ✅ Can use custom action handler URLs

### Paid Tier (Blaze Plan):
- ✅ Can use custom SMTP
- ✅ Can customize sender domain
- ✅ Full email customization
- ✅ Better deliverability

## Recommended Email Services

If you upgrade to Blaze plan, use one of these:

1. **SendGrid** (Recommended)
   - Free tier: 100 emails/day
   - Good deliverability
   - Easy setup with Firebase
   - https://sendgrid.com/

2. **AWS SES**
   - Very cheap ($0.10 per 1000 emails)
   - High deliverability
   - Requires AWS account
   - https://aws.amazon.com/ses/

3. **Mailgun**
   - Free tier: 5000 emails/month
   - Good for developers
   - https://www.mailgun.com/

4. **Postmark**
   - Excellent deliverability
   - Focus on transactional emails
   - https://postmarkapp.com/

## Implementation Checklist

### Immediate (No cost):
- [x] ✅ Created custom password reset page
- [x] ✅ Configured custom action URL
- [ ] Update email template in Firebase Console
- [ ] Improve email HTML structure
- [ ] Add clear sender name "PhishGuard Security"
- [ ] Test email deliverability

### Short-term (Within 1 week):
- [ ] Set up SendGrid free account
- [ ] Configure custom SMTP in Firebase
- [ ] Add SPF records
- [ ] Test email score with mail-tester.com

### Long-term (If building production):
- [ ] Purchase custom domain (yourdomain.com)
- [ ] Configure DKIM and DMARC
- [ ] Set up email monitoring
- [ ] Configure email analytics

## Current Code Implementation

### AuthContext.jsx - resetPassword function:
```javascript
const resetPassword = async (email) => {
  const actionCodeSettings = {
    url: `${window.location.origin}/reset-password`,
    handleCodeInApp: true,
  };
  return await sendPasswordResetEmail(auth, email, actionCodeSettings);
};
```

This ensures users are directed to our custom, branded password reset page instead of Firebase's default page.

## Support Resources

- Firebase Email Templates: https://firebase.google.com/docs/auth/custom-email-handler
- Email Deliverability Guide: https://postmarkapp.com/guides/deliverability
- SPF Record Checker: https://mxtoolbox.com/spf.aspx
- DKIM Record Checker: https://mxtoolbox.com/dkim.aspx

---

## Need Help?

If emails still go to spam after following this guide:
1. Check spam score at mail-tester.com
2. Verify SPF/DKIM records are correct
3. Consider upgrading to Firebase Blaze plan
4. Use a dedicated email service (SendGrid/AWS SES)

**Note:** Firebase free tier has inherent limitations. For production apps with many users, custom SMTP with your own domain is essential for reliable email delivery.
