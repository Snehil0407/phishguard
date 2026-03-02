import { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { getEmailCredentials } from '../services/userService';

const EmailMonitoringContext = createContext();

export const useEmailMonitoring = () => {
  const context = useContext(EmailMonitoringContext);
  if (!context) {
    throw new Error('useEmailMonitoring must be used within an EmailMonitoringProvider');
  }
  return context;
};

export const EmailMonitoringProvider = ({ children, currentUser }) => {
  const [monitoringStatus, setMonitoringStatus] = useState({
    isActive: false,
    connectedEmail: null,
    lastCheck: null,
    scansPerformed: 0
  });
  
  const [recentAnalysis, setRecentAnalysis] = useState([]);
  const [emailCredentials, setEmailCredentials] = useState(null);
  const [fetchingInitialResults, setFetchingInitialResults] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const pollIntervalRef = useRef(null);
  const keepAliveIntervalRef = useRef(null);
  const notifiedKeysRef = useRef(new Set());

  // Initialize monitoring on app load
  useEffect(() => {
    const initializeMonitoring = async () => {
      if (!currentUser) return;
      
      try {
        console.log('🔍 [GLOBAL] Initializing email monitoring...');
        
        // Check localStorage for active monitoring
        const savedMonitoringState = localStorage.getItem(`emailMonitoring_${currentUser.uid}`);
        
        // Load saved credentials
        const savedCreds = await getEmailCredentials(currentUser.uid);
        console.log('🔍 [GLOBAL] getEmailCredentials result:', savedCreds ? { 
          email: savedCreds.emailAddress, 
          hasPassword: !!savedCreds.password,
          passwordLength: savedCreds.password?.length,
          provider: savedCreds.provider 
        } : 'null');
        
        if (savedCreds) {
          setEmailCredentials(savedCreds);
          console.log('✅ [GLOBAL] Set emailCredentials state with saved credentials');
          
          // Check if monitoring is already active
          let shouldRestoreMonitoring = false;
          
          if (savedMonitoringState) {
            try {
              const parsedState = JSON.parse(savedMonitoringState);
              if (parsedState.isActive) {
                shouldRestoreMonitoring = true;
                console.log('✅ [GLOBAL] Found active monitoring in localStorage');
              }
            } catch (e) {
              console.error('Error parsing monitoring state:', e);
            }
          }
          
          // Verify with backend
          try {
            const statusResponse = await api.get('/api/email/monitoring-status', {
              params: { user_id: currentUser.uid }
            });
            
            if (statusResponse.data.success && statusResponse.data.data.is_active) {
              shouldRestoreMonitoring = true;
              console.log('✅ [GLOBAL] Backend confirms monitoring is ACTIVE');
            } else {
              console.log('⚠️ [GLOBAL] Backend says monitoring is NOT active');
              localStorage.removeItem(`emailMonitoring_${currentUser.uid}`);
            }
          } catch (statusError) {
            console.error('[GLOBAL] Error checking monitoring status:', statusError);
          }
          
          if (shouldRestoreMonitoring) {
            console.log('🔄 [GLOBAL] RESTORING active monitoring session');
            const restoredState = {
              isActive: true,
              connectedEmail: savedCreds.emailAddress,
              lastCheck: new Date(),
              scansPerformed: 0
            };
            setMonitoringStatus(restoredState);
            
            // Start polling immediately
            startPolling(savedCreds);
            startKeepAlive(savedCreds);
            
            // Fetch existing results silently (marks them as seen, no notifications for old emails)
            fetchResults(currentUser.uid, savedCreds.emailAddress, false, true);
          }
        }
      } catch (error) {
        console.error('[GLOBAL] Error initializing monitoring:', error);
      }
    };
    
    initializeMonitoring();
  }, [currentUser]);

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) return 'unsupported';
    if (Notification.permission === 'granted') return 'granted';
    if (Notification.permission === 'denied') return 'denied';
    const result = await Notification.requestPermission();
    return result;
  };

  // Fire a browser notification for a phishing result
  const firePhishingNotification = (result) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const from = result.email_data?.from_name || result.email_data?.from_email || 'Unknown sender';
    const subject = result.email_data?.subject || 'No subject';
    const risk = result.analysis?.risk_score ?? '?';
    try {
      const notification = new Notification('⚠️ Phishing Email Detected — PhishGuard', {
        body: `From: ${from}\nSubject: ${subject}\nRisk Score: ${risk}%`,
        icon: '/vite.svg',
        tag: `phishguard-phish-${result.timestamp}`,
        requireInteraction: true
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.warn('[NOTIFY] Could not show notification:', e);
    }
  };

  // Start polling for results
  const startPolling = (creds) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    console.log('✅ [GLOBAL] Starting polling interval');
    
    // Fetch immediately in silent mode — marks existing emails as seen
    // so we only notify for NEW emails that arrive after this point.
    fetchResults(currentUser.uid, creds.emailAddress, false, true);
    
    // Then poll every 15 seconds (not silent — new phishing triggers notifications)
    pollIntervalRef.current = setInterval(() => {
      console.log('🔄 [GLOBAL POLL] Fetching results...');
      fetchResults(currentUser.uid, creds.emailAddress);
    }, 15000);
  };

  // Stop polling
  const stopPolling = () => {
    if (pollIntervalRef.current) {
      console.log('🛑 [GLOBAL] Stopping polling');
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  // Keep-alive mechanism to restart backend monitoring if it stops
  const startKeepAlive = (creds) => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
    }
    
    console.log('💓 [GLOBAL] Starting keep-alive interval');
    
    keepAliveIntervalRef.current = setInterval(async () => {
      try {
        console.log('💓 [GLOBAL KEEP-ALIVE] Checking backend status...');
        const statusResponse = await api.get('/api/email/monitoring-status', {
          params: { user_id: currentUser.uid }
        });
        
        if (!statusResponse.data.data.is_active) {
          console.log('⚠️ [GLOBAL] Backend monitoring stopped! Restarting...');
          
          // Restart monitoring
          const restartResponse = await api.post('/api/email/start-monitoring', {
            user_id: currentUser.uid,
            email_address: creds.emailAddress,
            password: creds.password,
            check_interval: 120
          });
          
          if (restartResponse.data.success) {
            console.log('✅ [GLOBAL] Monitoring restarted successfully');
          } else {
            console.error('❌ [GLOBAL] Failed to restart monitoring');
          }
        } else {
          console.log('✅ [GLOBAL] Backend monitoring still active');
        }
      } catch (error) {
        console.error('[GLOBAL] Keep-alive check failed:', error);
      }
    }, 60000); // Every 60 seconds
  };

  // Stop keep-alive
  const stopKeepAlive = () => {
    if (keepAliveIntervalRef.current) {
      console.log('🛑 [GLOBAL] Stopping keep-alive');
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }
  };

  // Fetch results from backend
  // silentInit=true: mark existing results as seen without notifying (used on session restore)
  const fetchResults = async (userId, emailAddress, isManualRefresh = false, silentInit = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      }
      
      const response = await api.get('/api/email/recent-results', {
        params: {
          user_id: userId,
          email_address: emailAddress
        }
      });
      
      if (response.data.success && response.data.data.results) {
        const newResults = response.data.data.results;
        
        if (newResults.length > 0) {
          if (!silentInit) {
            // Find the single newest result that hasn't been seen before
            // Results are assumed newest-first; find the first unseen phishing one
            const firstNewPhishing = newResults.find(result => {
              const key = (result.timestamp || '') + (result.email_data?.subject || '');
              return !notifiedKeysRef.current.has(key) && result.analysis?.is_phishing;
            });
            if (firstNewPhishing) {
              firePhishingNotification(firstNewPhishing);
            }
          }

          // Mark ALL results as seen so we never re-notify them
          newResults.forEach(result => {
            const key = (result.timestamp || '') + (result.email_data?.subject || '');
            notifiedKeysRef.current.add(key);
          });

          // Only replace results when we have actual data.
          // This prevents the results panel from disappearing on empty / transient API responses.
          setRecentAnalysis(newResults);
          setMonitoringStatus(prev => ({
            ...prev,
            scansPerformed: newResults.length,
            lastCheck: new Date()
          }));
        } else {
          // No new results yet — just update the timestamp, keep existing results visible.
          setMonitoringStatus(prev => ({
            ...prev,
            lastCheck: new Date()
          }));
        }
        
        return newResults.length;
      }
      return 0;
    } catch (error) {
      console.error('[GLOBAL] Error fetching results:', error);
      return 0;
    } finally {
      if (isManualRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  // Start monitoring
  const startMonitoring = async (emailData) => {
    try {
      console.log('▶️ [GLOBAL] Starting monitoring...');

      // Request notification permission when monitoring starts
      await requestNotificationPermission();
      
      const response = await api.post('/api/email/start-monitoring', {
        user_id: currentUser.uid,
        email_address: emailData.emailAddress,
        password: emailData.password,
        check_interval: 120
      });

      if (response.data.success) {
        const newState = {
          isActive: true,
          connectedEmail: emailData.emailAddress,
          lastCheck: new Date().toISOString(),
          scansPerformed: 0
        };
        
        setMonitoringStatus(newState);
        setEmailCredentials(emailData);
        
        // Save to localStorage
        localStorage.setItem(`emailMonitoring_${currentUser.uid}`, JSON.stringify(newState));
        console.log('💾 [GLOBAL] Saved monitoring state');
        
        // Immediately fetch initial results with retry logic
        console.log('🔄 [GLOBAL] Fetching initial results...');
        setFetchingInitialResults(true);
        
        // Try multiple times with increasing delays
        let attempts = 0;
        const maxAttempts = 3;
        let resultsCount = 0;
        
        while (attempts < maxAttempts && resultsCount === 0) {
          attempts++;
          const delay = attempts * 2000; // 2s, 4s, 6s
          
          console.log(`⏳ [GLOBAL] Attempt ${attempts}/${maxAttempts} - waiting ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          resultsCount = await fetchResults(currentUser.uid, emailData.emailAddress, false, true);
          
          if (resultsCount > 0) {
            console.log(`✅ [GLOBAL] Got ${resultsCount} initial results!`);
            break;
          }
          
          if (attempts < maxAttempts) {
            console.log('⚠️ [GLOBAL] No results yet, retrying...');
          } else {
            console.log(`ℹ️ [GLOBAL] No results after ${maxAttempts} attempts. Backend may still be processing.`);
          }
        }
        
        setFetchingInitialResults(false);
        
        // Start polling and keep-alive
        startPolling(emailData);
        startKeepAlive(emailData);
        
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('[GLOBAL] Error starting monitoring:', error);
      return { success: false, message: error.response?.data?.detail || 'Failed to start monitoring' };
    }
  };

  // Stop monitoring
  const stopMonitoring = async () => {
    try {
      console.log('⏹️ [GLOBAL] Stopping monitoring...');
      
      // Stop polling immediately
      stopPolling();
      stopKeepAlive();
      
      // Clear localStorage
      localStorage.removeItem(`emailMonitoring_${currentUser.uid}`);
      
      const response = await api.post('/api/email/stop-monitoring', null, {
        params: {
          user_id: currentUser.uid,
          email_address: emailCredentials?.emailAddress
        }
      });

      if (response.data.success) {
        setMonitoringStatus({
          isActive: false,
          connectedEmail: null,
          lastCheck: null,
          scansPerformed: 0
        });
        setRecentAnalysis([]);
        
        return { success: true };
      } else {
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('[GLOBAL] Error stopping monitoring:', error);
      return { success: false, message: error.response?.data?.detail || 'Failed to stop monitoring' };
    }
  };

  // Refresh results manually
  const refreshResults = async () => {
    if (emailCredentials) {
      await fetchResults(currentUser.uid, emailCredentials.emailAddress, true);
    }
  };

  // Update credentials (called after validation/saving)
  const updateCredentials = (credentials) => {
    setEmailCredentials(credentials);
    console.log('✅ [GLOBAL] Updated credentials in context');
  };

  const value = {
    monitoringStatus,
    recentAnalysis,
    emailCredentials,
    fetchingInitialResults,
    isRefreshing,
    startMonitoring,
    stopMonitoring,
    refreshResults,
    updateCredentials,
    requestNotificationPermission
  };

  return (
    <EmailMonitoringContext.Provider value={value}>
      {children}
    </EmailMonitoringContext.Provider>
  );
};
