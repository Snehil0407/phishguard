# Email Monitoring Feature - Setup Guide

## Overview
PhishGuard now includes real-time email monitoring using IMAP protocol. This feature allows users to connect their email accounts and automatically scan incoming emails for phishing threats.

## Features
- 🔐 Secure IMAP connection to email providers (Gmail, Outlook, Yahoo, etc.)
- 📧 Real-time email monitoring with configurable intervals
- 🤖 Automatic phishing analysis using PhishGuard ML models
- 🔔 Real-time notifications for detected threats
- 📊 Complete scan history and analytics

## Prerequisites

### For Gmail Users
1. Enable 2-Factor Authentication on your Google Account
2. Generate an App-Specific Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated 16-character password
3. Enable IMAP access:
   - Gmail Settings → Forwarding and POP/IMAP → Enable IMAP

### For Outlook/Hotmail Users
1. Enable 2-Factor Authentication
2. Generate App Password:
   - Go to: https://account.microsoft.com/security
   - Select "App passwords" → Create new
3. IMAP is enabled by default

### For Yahoo Users
1. Enable 2-Factor Authentication
2. Generate App Password:
   - Go to: https://login.yahoo.com/account/security
   - Select "Generate app password"
3. IMAP is enabled by default

## Backend Setup

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

Required packages:
- `imapclient` - IMAP protocol client
- `email-validator` - Email validation
- `httpx` - Async HTTP client
- `python-dateutil` - Date/time utilities

### 2. Start Backend Server
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

The server will start on http://localhost:8000

### 3. Verify API Endpoints
Available email monitoring endpoints:
- `POST /api/email/validate` - Validate email credentials
- `POST /api/email/analyze-recent` - Analyze last 10 emails
- `POST /api/email/start-monitoring` - Start continuous monitoring
- `POST /api/email/stop-monitoring` - Stop monitoring
- `GET /api/email/monitoring-status` - Check monitoring status

## API Usage Examples

### 1. Validate Credentials
```bash
curl -X POST http://localhost:8000/api/email/validate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "email_address": "your-email@gmail.com",
    "password": "your-app-password"
  }'
```

### 2. Analyze Recent Emails
```bash
curl -X POST http://localhost:8000/api/email/analyze-recent \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "email_address": "your-email@gmail.com",
    "password": "your-app-password"
  }'
```

### 3. Start Monitoring
```bash
curl -X POST http://localhost:8000/api/email/start-monitoring \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "email_address": "your-email@gmail.com",
    "password": "your-app-password",
    "check_interval": 300
  }'
```

## Data Flow

```
IMAP Server → Email Monitor Service → Email Parser → ML Analysis → Result Storage → User Notification
```

### Email Data Parsed
- **Headers**: From, To, Subject, Date, Message-ID
- **Body**: Plain text and HTML content
- **Links**: All URLs extracted from email body
- **Sender Info**: Email address and display name
- **Metadata**: Timestamps, message IDs

### Analysis Output
```json
{
  "is_phishing": true/false,
  "confidence": 0.95,
  "risk_score": 85,
  "severity": "high",
  "explanation": {
    "red_flags": ["Suspicious sender", "Urgency tactics"],
    "green_flags": ["Known domain"],
    "keywords_found": ["urgent", "verify"],
    "suspicious_urls": [
      {
        "url": "http://phishing-site.com",
        "risk_score": 0.92
      }
    ]
  }
}
```

## Frontend Integration (Coming Next)

The frontend will be updated with:
1. **Profile Page**: Email connection card
2. **Dashboard**: Email monitoring status widget
3. **Notifications**: Real-time phishing alerts
4. **Scan History**: Email scan results timeline

## Security Considerations

### Password Storage
- **NEVER** store passwords in plaintext
- Use environment variables or secure storage
- Consider using encrypted credential storage
- Implement token-based authentication for production

### IMAP Security
- Always use SSL/TLS (port 993)
- Validate SSL certificates
- Use app-specific passwords, not main passwords
- Implement rate limiting to prevent abuse

### Data Privacy
- Email content is only analyzed, never stored permanently
- Only metadata (subject, sender, timestamp) stored in scan history
- Users can delete scan history anytime
- Comply with privacy regulations (GDPR, etc.)

## Troubleshooting

### Authentication Failed
- Verify 2FA is enabled
- Check app password is correct (no spaces)
- Ensure IMAP is enabled in email settings
- Try generating a new app password

### Connection Timeout
- Check firewall settings (allow port 993)
- Verify internet connection
- Check IMAP server address is correct
- Try different IMAP server (backup servers)

### No Emails Fetched
- Verify INBOX has emails
- Check folder name (some providers use different names)
- Ensure account has recent emails
- Check date filter settings

### Analysis Errors
- Verify backend ML models are loaded
- Check API endpoint is accessible
- Review backend logs for errors
- Ensure sufficient system resources

## Performance Optimization

### Check Intervals
- Default: 120 seconds (2 minutes)
- Recommended range: 60-600 seconds
- Lower intervals = higher resource usage
- Adjust based on email volume

### Resource Usage
- Each monitor: ~10-20 MB RAM
- CPU usage: Minimal (mostly waiting)
- Network: ~1-5 KB per check (if no new emails)
- Disk: Analysis results stored in Firestore

## Testing Checklist

- [ ] Backend dependencies installed
- [ ] Backend server starts successfully
- [ ] Can validate Gmail credentials
- [ ] Can validate Outlook credentials
- [ ] Can fetch and parse emails correctly
- [ ] Email analysis returns expected format
- [ ] Keywords extracted correctly
- [ ] URLs extracted correctly
- [ ] Monitoring starts without errors
- [ ] Monitoring can be stopped
- [ ] Status endpoint returns correct data

## Next Steps

1. ✅ Backend email monitoring service created
2. ✅ API endpoints implemented
3. ⏳ Frontend email connection UI (in progress)
4. ⏳ Notification system integration
5. ⏳ Complete end-to-end testing

## Support

For issues or questions:
1. Check backend logs: `backend/*.log`
2. Review API documentation: http://localhost:8000/docs
3. Test with curl commands first
4. Verify email provider settings

---

**Last Updated**: February 12, 2026
**Version**: 1.0.0
**Status**: Backend Complete, Frontend In Progress
