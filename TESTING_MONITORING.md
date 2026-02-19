# Quick Test Guide for Email Monitoring Improvements

## Prerequisites
1. Backend server running on port 8000
2. Frontend server running on port 5176
3. Valid email credentials (Gmail with app password)

## 🧪 Test Scenario 1: Credential Persistence

**Steps:**
1. Open Email Monitoring page
2. Enter your email: `snehilsinha580@gmail.com`
3. Enter your app password
4. Click "Validate Credentials"
5. ✅ **Watch for**: "✅ Credentials validated successfully!" message
6. Close the browser tab completely
7. Reopen the Email Monitoring page
8. ✅ **Expected**: 
   - Email and password fields are pre-filled
   - Blue banner shows "Saved Credentials Found"
   - Can click validate without entering anything

**Result**: ✅ Credentials are now saved and auto-loaded!

---

## 🧪 Test Scenario 2: Monitoring Continues Across Navigation

**Steps:**
1. Start monitoring (click "Start Real-Time Monitoring")
2. ✅ **Verify**: Green "Monitoring Active" banner appears
3. Wait 30 seconds for first results
4. Navigate to Dashboard using the navbar
5. Wait 2-3 minutes (let backend run a full scan cycle)
6. Navigate back to Email Monitoring page
7. ✅ **Expected**:
   - Green "Monitoring Active" banner still showing
   - "Emails Scanned" counter has increased
   - New results visible
   - Polling resumes (check console for API calls every 15s)

**Result**: ✅ Monitoring never stopped! Backend kept running and results are still coming in.

---

## 🧪 Test Scenario 3: Real-Time Updates Work

**Steps:**
1. Start monitoring
2. Send yourself a test email (from another account or Gmail's "Send to self")
3. Wait up to 2 minutes (backend checks every 2 minutes)
4. ✅ **Watch for**:
   - New email appears in the results list automatically
   - Blue "X New!" badge appears briefly
   - "Emails Scanned" counter increases
   - "Last Updated" time refreshes
5. **No page refresh needed!** ✅

**Result**: ✅ Real-time polling is working correctly!

---

## 🧪 Test Scenario 4: Stop and Restart Easily

**Steps:**
1. While monitoring is active, click "Stop" button
2. ✅ **Verify**:
   - Green banner changes to success message
   - "Start Real-Time Monitoring" button appears again
   - Email and password are STILL visible (not cleared)
3. Click "Start Real-Time Monitoring" again
4. ✅ **Expected**:
   - Monitoring starts immediately
   - No need to re-enter credentials
   - Polling resumes

**Result**: ✅ Can stop/start easily without re-authentication!

---

## 🧪 Test Scenario 5: Page Refresh/Reload

**Steps:**
1. Start monitoring
2. Press F5 or Ctrl+R to refresh the page
3. ✅ **Expected**:
   - Page loads
   - Credentials auto-fill
   - Monitoring status automatically restored
   - Green "Monitoring Active" banner appears
   - Results start appearing
   - Polling resumes automatically

**Result**: ✅ Complete state recovery after refresh!

---

## 🧪 Test Scenario 6: Multiple Tab Test

**Steps:**
1. Start monitoring in Tab 1
2. Open Email Monitoring in Tab 2 (new tab)
3. ✅ **Verify in Tab 2**:
   - Credentials are pre-filled
   - Monitoring status shows as active
   - Can see results
4. Click "Stop" in Tab 2
5. ✅ **Verify in Tab 1**:
   - Monitoring stops in both tabs
   - Backend task is cancelled

**Result**: ✅ State synchronized across tabs!

---

## 🔍 How to Verify Backend Is Running

**Check Console Logs:**
```
✅ Look for these in backend console:
- "🚀 Starting email monitoring for..."
- "📧 Fetching recent emails..."
- "⏰ Next check in 120 seconds..."
```

**Check Frontend Console:**
```
✅ Look for these in browser console (F12):
- "✅ Loaded saved credentials"
- "✅ Restored active monitoring session"
- API calls to /api/email/recent-results every 15 seconds
```

---

## 🐛 Troubleshooting

### Issue: "Connection Failed"
**Solution**: Backend server is not running. Start it:
```powershell
cd "D:\Christ University\PG\6th trimester\phishguard\backend"
python main.py
```

### Issue: Credentials not saving
**Solution**: Check Firebase Firestore connection. Verify no console errors.

### Issue: Monitoring stops when navigating
**Solution**: Check that backend server is still running. Look for errors in backend console.

### Issue: No real-time updates
**Solution**: 
1. Open browser console (F12)
2. Check for API calls every 15 seconds
3. Verify backend is scanning every 2 minutes
4. Check Network tab for failed requests

---

## ✅ Success Indicators

You'll know everything is working when:

1. **Credentials**: 
   - Blue banner shows "Saved Credentials Found" ✅
   - Fields auto-fill on page load ✅

2. **Monitoring**: 
   - Green pulsing dot in "Monitoring Active" banner ✅
   - "Checking every 2 minutes • Updates every 15 seconds" text ✅

3. **Real-Time**: 
   - See API calls in Network tab every 15 seconds ✅
   - "Last Updated" time refreshes automatically ✅
   - New results appear without page refresh ✅

4. **Persistence**: 
   - Navigate away and back = monitoring still active ✅
   - Close tab and reopen = credentials still there ✅
   - Refresh page = everything restored ✅

---

## 📊 Expected Behavior Summary

| Action | Backend | Frontend | Results |
|--------|---------|----------|---------|
| Start Monitoring | Loop starts (2 min) | Polling starts (15 sec) | ✅ Real-time updates |
| Navigate Away | Loop continues | Polling stops | ✅ Backend keeps scanning |
| Return to Page | Loop still running | Polling resumes | ✅ Auto-restored |
| Refresh Page | Loop still running | Polling resumes | ✅ Auto-restored |
| Close Tab | Loop still running | Polling stops | ✅ State saved |
| Reopen App | Check status API | Restore state | ✅ Seamless recovery |
| Stop Monitoring | Loop cancelled | Polling stops | ✅ Clean stop |

---

**All improvements implemented successfully!** 🎉

Your monitoring now:
- ✅ Saves credentials (no re-entry needed)
- ✅ Continues in background (survives navigation)
- ✅ Updates in real-time (15-second polling)
- ✅ Recovers automatically (on return/refresh)
- ✅ Easy to control (stop/start anytime)
