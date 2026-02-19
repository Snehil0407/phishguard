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
            
            // Fetch existing results
            fetchResults(currentUser.uid, savedCreds.emailAddress);
          }
        }
      } catch (error) {
        console.error('[GLOBAL] Error initializing monitoring:', error);
      }
    };
    
    initializeMonitoring();
  }, [currentUser]);

  // Start polling for results
  const startPolling = (creds) => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    console.log('✅ [GLOBAL] Starting polling interval');
    
    // Fetch immediately
    fetchResults(currentUser.uid, creds.emailAddress);
    
    // Then poll every 15 seconds
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
  const fetchResults = async (userId, emailAddress, isManualRefresh = false) => {
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
        
        // Smoothly update results without clearing first
        setRecentAnalysis(newResults);
        setMonitoringStatus(prev => ({
          ...prev,
          scansPerformed: newResults.length,
          lastCheck: new Date()
        }));
        
        return newResults.length; // Return count for retry logic
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
          
          resultsCount = await fetchResults(currentUser.uid, emailData.emailAddress);
          
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
    updateCredentials
  };

  return (
    <EmailMonitoringContext.Provider value={value}>
      {children}
    </EmailMonitoringContext.Provider>
  );
};
