import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Shield, CheckCircle, XCircle, Loader, AlertTriangle, Play, Square, RefreshCw, Eye, EyeOff, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useEmailMonitoring } from '../context/EmailMonitoringContext';
import api from '../services/api';
import { saveEmailCredentials } from '../services/userService';

const EmailMonitoring = () => {
  const { currentUser } = useAuth();
  const { monitoringStatus, recentAnalysis, emailCredentials, fetchingInitialResults, isRefreshing, sessionSummary, startMonitoring, stopMonitoring, refreshResults, updateCredentials } = useEmailMonitoring();
  
  const [step, setStep] = useState(1); // 1: Input, 2: Validating, 3: Connected
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [emailData, setEmailData] = useState({
    emailAddress: '',
    password: '',
    provider: 'gmail'
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [newResultsCount, setNewResultsCount] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  // Once results have been loaded at least once, keep the container mounted
  // even if recentAnalysis briefly goes empty between polls.
  const hasLoadedResultsRef = useRef(false);

  const formatDuration = (durationMs) => {
    if (!durationMs || durationMs < 1000) return 'Less than a minute';
    const totalSeconds = Math.floor(durationMs / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Debug: Log emailData changes
  useEffect(() => {
    console.log('[UI] 📝 emailData state changed:', {
      email: emailData.emailAddress,
      hasPassword: !!emailData.password,
      passwordLength: emailData.password?.length,
      passwordPreview: emailData.password ? `${emailData.password.substring(0, 3)}...` : 'empty',
      provider: emailData.provider
    });
  }, [emailData]);

  // Load saved credentials from context and restore UI state
  useEffect(() => {
    console.log('[UI] ═══════════════════════════════════════');
    console.log('[UI] Effect triggered');
    console.log('[UI] - currentUser exists:', !!currentUser);
    console.log('[UI] - emailCredentials exists:', !!emailCredentials);
    console.log('[UI] - emailCredentials value:', emailCredentials);
    console.log('[UI] - monitoringStatus.isActive:', monitoringStatus.isActive);
    console.log('[UI] - Current emailData:', emailData);
    
    if (!currentUser) {
      console.log('[UI] ⚠️ No currentUser, skipping...');
      return;
    }
    
    // Use credentials from global context
    if (emailCredentials && emailCredentials.emailAddress) {
      console.log('[UI] ✅ Credentials found in context!');
      console.log('[UI] - Email:', emailCredentials.emailAddress);
      console.log('[UI] - Password length:', emailCredentials.password?.length);
      console.log('[UI] - Provider:', emailCredentials.provider);
      
      // Set emailData with a fresh object to ensure React sees the change
      const newData = {
        emailAddress: emailCredentials.emailAddress || '',
        password: emailCredentials.password || '',
        provider: emailCredentials.provider || 'gmail'
      };
      
      console.log('[UI] 📝 Setting emailData to:', newData);
      setEmailData(newData);
      console.log('[UI] ✅ setEmailData called!');
    } else {
      console.log('[UI] ⚠️ No credentials in context yet');
    }
    
    // If global monitoring is active, set UI to show step 3
    if (monitoringStatus.isActive) {
      setStep(3);
      console.log('[UI] Monitoring active - showing step 3');
    }
    console.log('[UI] ═══════════════════════════════════════');
  }, [currentUser, emailCredentials, monitoringStatus.isActive]);

  // Track new results count
  useEffect(() => {
    const prevCount = recentAnalysis.length;
    // This runs when recentAnalysis updates from global context
  }, [recentAnalysis]);

  // Clear messages when changing steps
  useEffect(() => {
    // Don't clear messages automatically
  }, [step]);

  const providers = [
    { id: 'gmail', name: 'Gmail', domain: '@gmail.com' },
    { id: 'outlook', name: 'Outlook', domain: '@outlook.com' },
    { id: 'yahoo', name: 'Yahoo', domain: '@yahoo.com' },
    { id: 'icloud', name: 'iCloud', domain: '@icloud.com' }
  ];

  const handleValidateCredentials = async () => {
    console.log('[VALIDATE] Starting validation...', { email: emailData.emailAddress });
    
    if (!emailData.emailAddress || !emailData.password) {
      setSuccess('');
      setError('Please enter both email and password');
      return;
    }

    // Final validation before sending
    const cleanPassword = emailData.password.replace(/\s/g, '');
    if (cleanPassword.length < 8) {
      setSuccess('');
      setError('App password seems too short. App passwords are typically 16 characters. Please check and try again.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    
    console.log('[VALIDATE] Sending request to backend...');

    try {
      const response = await api.post('/api/email/validate', {
        user_id: currentUser.uid,
        email_address: emailData.emailAddress,
        password: cleanPassword
      });

      console.log('[VALIDATE] Backend response:', response.data);

      if (response.data.success) {
        setValidationResult(response.data);
        setError('');
        setSuccess('✅ Credentials validated successfully!');
        console.log('[VALIDATE] Validation successful!');
        
        // Save credentials for future use (don't block on this)
        try {
          await saveEmailCredentials(
            currentUser.uid,
            emailData.emailAddress,
            cleanPassword,
            emailData.provider
          );
          console.log('[VALIDATE] ✅ Credentials saved to Firestore');
          
          // Update context with saved credentials
          updateCredentials({
            emailAddress: emailData.emailAddress,
            password: cleanPassword,
            provider: emailData.provider
          });
        } catch (saveError) {
          console.warn('[VALIDATE] ⚠️ Could not save credentials:', saveError);
          // Don't show error to user since validation succeeded
        }
        
        console.log('[VALIDATE] Moving to step 2');
        setStep(2);
        
        // Clear success message after 3 seconds on step 2
        setTimeout(() => {
          console.log('[VALIDATE] Auto-clearing success message');
          setSuccess('');
        }, 3000);
      } else {
        console.log('[VALIDATE] Validation failed:', response.data.message);
        setSuccess('');
        setError(response.data.message);
      }
    } catch (err) {
      console.error('[VALIDATE] Validation error:', err);
      const errorMessage = err.response?.data?.detail || 'Failed to validate credentials';
      setSuccess('');
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log('[VALIDATE] Validation complete, loading=false');
    }
  };

  const handleAnalyzeRecent = async () => {
    // Start monitoring which includes analyzing recent emails
    setLoading(true);
    setError('');

    try {
      const result = await startMonitoring(emailData);
      
      if (result.success) {
        setError('');
        setSuccess('✅ Email monitoring started successfully!');
        setStep(3);
        
        // Auto-dismiss success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setSuccess('');
        setError(result.message || 'Failed to start monitoring');
      }
    } catch (err) {
      setSuccess('');
      setError('Failed to start monitoring');
      console.error('[UI] Error starting monitoring:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartMonitoring = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await startMonitoring(emailData);
      
      if (result.success) {
        setError('');
        setSuccess('✅ Email monitoring started successfully!');
        
        // Auto-dismiss success message after 3 seconds
        setTimeout(() => {
          setSuccess('');
        }, 3000);
      } else {
        setSuccess('');
        setError(result.message || 'Failed to start monitoring');
      }
    } catch (err) {
      setSuccess('');
      setError('Failed to start monitoring');
    } finally {
      setLoading(false);
    }
  };

  const handleStopMonitoring = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await stopMonitoring();
      
      if (result.success) {
        setError('');
        setSuccess('✅ Monitoring stopped. Click Start to resume.');
        setNewResultsCount(0);
      } else {
        setSuccess('');
        setError(result.message || 'Failed to stop monitoring');
      }
    } catch (err) {
      setSuccess('');
      setError('Failed to stop monitoring');
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    // Simply go back to step 1 without clearing saved credentials
    setStep(1);
    setValidationResult(null);
    setSuccess('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Mail className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Email Monitoring
          </h1>
          <p className="text-xl text-gray-600">
            Connect your email account for real-time phishing protection
          </p>
        </motion.div>

        {/* Info Banner - Show only on step 1 */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8"
          >
            <div className="flex items-start space-x-3">
              <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Important: Use App-Specific Passwords</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Gmail:</strong> Generate at <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="underline">myaccount.google.com/apppasswords</a></li>
                  <li>• <strong>Outlook:</strong> Generate at <a href="https://account.microsoft.com/security" target="_blank" rel="noopener noreferrer" className="underline">account.microsoft.com/security</a></li>
                  <li>• <strong>Yahoo:</strong> Generate at <a href="https://login.yahoo.com/account/security" target="_blank" rel="noopener noreferrer" className="underline">login.yahoo.com/account/security</a></li>
                  <li className="mt-2 font-medium">⚠️ Enable 2FA first, then generate app password. Copy entire password - spaces will be removed automatically.</li>
                </ul>
              </div>
            </div>
          </motion.div>
        )}

        {/* Common Issues Card - Show only on step 1 */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8"
          >
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-2">Getting "Authentication Failed"? Try These:</h3>
                <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
                  <li><strong>Check 2FA is enabled</strong> on your email account (required for app passwords)</li>
                  <li><strong>Generate a NEW app password</strong> - don't use your regular email password</li>
                  <li><strong>Copy the ENTIRE password</strong> including any spaces (we remove them automatically)</li>
                  <li><strong>Enable IMAP access</strong> in your email settings:
                    <ul className="ml-6 mt-1 space-y-1 list-disc">
                      <li>Gmail: Settings → Forwarding and POP/IMAP → Enable IMAP</li>
                      <li>Outlook: Already enabled by default</li>
                      <li>Yahoo: Settings → Security → Enable IMAP</li>
                    </ul>
                  </li>
                  <li><strong>Wait a few minutes</strong> after generating app password for it to activate</li>
                </ol>
              </div>
            </div>
          </motion.div>
        )}

        {/* Status Messages - Show only one at a time */}
        {error && !success && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
          >
            <div className="flex items-start space-x-3">
              <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-800 mb-2">Connection Failed</p>
                <div className="text-sm text-red-700 whitespace-pre-line">{error}</div>
                {error.includes('Authentication') && (
                  <div className="mt-3 pt-3 border-t border-red-200">
                    <p className="font-semibold text-red-800 mb-2">Quick Fixes:</p>
                    <ul className="text-xs text-red-700 space-y-1">
                      <li>✓ Make sure you're using an <strong>app password</strong>, not your regular password</li>
                      <li>✓ Check that 2-Factor Authentication is enabled on your email account</li>
                      <li>✓ Remove any spaces when pasting the app password</li>
                      <li>✓ Try generating a new app password if the current one doesn't work</li>
                      <li>✓ Verify IMAP is enabled in your email settings</li>
                    </ul>
                    <button
                      onClick={() => {
                        setError('');
                        setEmailData({ ...emailData, password: '' });
                      }}
                      className="mt-3 w-full py-2 px-4 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-all"
                    >
                      Clear & Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {success && !error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center space-x-3"
          >
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
          </motion.div>
        )}

        {/* Real-time Monitoring Banner */}
        <AnimatePresence>
          {monitoringStatus.isActive && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative flex-shrink-0">
                    <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">Live Monitoring Active</p>
                    <p className="text-sm text-blue-700">
                      Checking inbox every 2 minutes • {recentAnalysis.length} emails analyzed
                    </p>
                  </div>
                </div>
                {newResultsCount > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-3 py-1 bg-blue-600 text-white text-sm font-semibold rounded-full"
                  >
                    +{newResultsCount} new
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Connection Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100"
        >
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Connect Email Account</h2>
              
              {/* Provider Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Email Provider</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {providers.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => setEmailData({ ...emailData, provider: provider.id })}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        emailData.provider === provider.id
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <div className="font-semibold">{provider.name}</div>
                      <div className="text-xs text-gray-500 mt-1">{provider.domain}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={emailData.emailAddress}
                  onChange={(e) => setEmailData({ ...emailData, emailAddress: e.target.value })}
                  placeholder={`your-email${providers.find(p => p.id === emailData.provider)?.domain || '@email.com'}`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* App Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 ">
                  App-Specific Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={emailData.password}
                    onChange={(e) => {
                      // Remove spaces automatically
                      const cleanPassword = e.target.value.replace(/\s/g, '');
                      setEmailData({ ...emailData, password: cleanPassword });
                    }}
                    placeholder="Enter your app-specific password (spaces removed automatically)"
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-red-600 font-medium">
                    ⚠️ IMPORTANT: Use an app password, NOT your main email password
                  </p>
                  <p className="text-xs text-gray-600">
                    💡 Tip: Copy the entire app password (with or without spaces) - we'll clean it automatically
                  </p>
                </div>
              </div>

              {/* Validate Button */}
              <button
                onClick={handleValidateCredentials}
                disabled={loading || !emailData.emailAddress || !emailData.password}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="h-5 w-5 animate-spin" />
                    <span>Validating...</span>
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    <span>Validate & Connect</span>
                  </>
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Credentials Validated!</h2>
                <p className="text-gray-600 mb-6">
                  Successfully connected to {emailData.emailAddress}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-3">What happens next?</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>We'll analyze your last 10 emails to test the connection</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>You can then start continuous monitoring for new emails</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Get instant alerts when phishing emails are detected</span>
                  </li>
                </ul>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAnalyzeRecent}
                  disabled={loading}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <Loader className="h-5 w-5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5" />
                      <span>Analyze Recent Emails</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <Shield className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Analysis Complete</h2>
                <p className="text-gray-600">
                  Ready to start monitoring {emailData.emailAddress}
                </p>
              </div>

              {fetchingInitialResults && recentAnalysis.length === 0 && (
                <div className="bg-blue-50 rounded-xl p-8 border border-blue-200">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <Loader className="h-12 w-12 text-blue-600 animate-spin" />
                    <div className="text-center">
                      <p className="text-lg font-semibold text-blue-900">Analyzing your emails...</p>
                      <p className="text-sm text-blue-700 mt-2">This may take a few moments as we scan your inbox</p>
                    </div>
                  </div>
                </div>
              )}

              {(recentAnalysis.length > 0 || hasLoadedResultsRef.current || !!sessionSummary) && (() => {
                // Mark that results have been shown — the panel stays mounted from here on
                if (recentAnalysis.length > 0) hasLoadedResultsRef.current = true;
                return (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm relative">
                  {/* Refresh overlay indicator */}
                  {isRefreshing && (
                    <div className="absolute top-4 right-4 z-10">
                      <div className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm font-medium shadow-sm">
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Refreshing...</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Recent Analysis Results</h3>
                    {newResultsCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-full flex items-center space-x-1"
                      >
                        <span>{newResultsCount} New!</span>
                      </motion.div>
                    )}
                  </div>
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {recentAnalysis.length === 0 ? (
                      monitoringStatus.isActive ? (
                        <div className="flex items-center justify-center py-8 text-gray-400">
                          <Loader className="h-5 w-5 animate-spin mr-2" />
                          <span>Waiting for results...</span>
                        </div>
                      ) : sessionSummary ? (
                        <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-base font-semibold text-gray-900">Last Monitoring Session Summary</h4>
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                              sessionSummary.foundPhishing
                                ? 'bg-red-100 text-red-700'
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {sessionSummary.foundPhishing ? 'Phishing Detected' : 'No Phishing Detected'}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                              <p className="text-xs text-gray-500">Monitoring Duration</p>
                              <p className="text-lg font-bold text-gray-900">{formatDuration(sessionSummary.durationMs)}</p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                              <p className="text-xs text-gray-500">Total Emails Scanned</p>
                              <p className="text-lg font-bold text-gray-900">{sessionSummary.totalScanned}</p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                              <p className="text-xs text-gray-500">Phishing Found</p>
                              <p className="text-lg font-bold text-red-600">{sessionSummary.phishingCount}</p>
                            </div>
                            <div className="bg-white border border-gray-200 rounded-lg p-3">
                              <p className="text-xs text-gray-500">Safe Emails</p>
                              <p className="text-lg font-bold text-green-600">{sessionSummary.safeCount}</p>
                            </div>
                          </div>

                          <p className="text-xs text-gray-500">
                            Ended at {sessionSummary.endedAt ? new Date(sessionSummary.endedAt).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center py-8 text-gray-400">
                          <span>No results available for this session.</span>
                        </div>
                      )
                    ) : (
                      recentAnalysis.map((result) => {
                        const stableKey = result.timestamp + result.email_data.subject;
                        return (
                          <motion.div
                            key={stableKey}
                            layout="position"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.18 }}
                            className={`p-5 rounded-xl border-2 shadow-sm hover:shadow-md transition-shadow ${
                              result.analysis.is_phishing
                                ? 'bg-gradient-to-br from-red-50 to-red-100 border-red-300'
                                : 'bg-gradient-to-br from-green-50 to-green-100 border-green-300'
                            }`}
                          >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div className="flex items-center space-x-2">
                              <div className={`p-2 rounded-lg ${
                                result.analysis.is_phishing ? 'bg-red-200' : 'bg-green-200'
                              }`}>
                                {result.analysis.is_phishing ? (
                                  <AlertTriangle className="h-6 w-6 text-red-700" />
                                ) : (
                                  <CheckCircle className="h-6 w-6 text-green-700" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-base font-semibold text-gray-900 leading-tight">
                                  {result.email_data.subject}
                                </p>
                              </div>
                            </div>
                            <div className="pl-12 space-y-1">
                              <p className="text-sm text-gray-700">
                                <span className="font-medium">From:</span> {result.email_data.from_name || result.email_data.from_email}
                              </p>
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Email:</span> {result.email_data.from_email}
                              </p>
                              {result.email_data.date && (
                                <p className="text-xs text-gray-500">
                                  {new Date(result.email_data.date).toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="pl-12 flex items-center justify-between">
                          <span className={`text-sm font-bold px-3 py-1.5 rounded-lg ${
                            result.analysis.severity === 'high' ? 'bg-red-200 text-red-900' :
                            result.analysis.severity === 'medium' ? 'bg-yellow-200 text-yellow-900' :
                            'bg-green-200 text-green-900'
                          }`}>
                            {result.analysis.is_phishing ? '⚠️ PHISHING' : '✅ SAFE'} • {result.analysis.risk_score}% Risk
                          </span>
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${
                            result.analysis.severity === 'high' ? 'bg-red-300 text-red-900' :
                            result.analysis.severity === 'medium' ? 'bg-yellow-300 text-yellow-900' :
                            'bg-green-300 text-green-900'
                          }`}>
                            {result.analysis.severity.toUpperCase()}
                          </span>
                        </div>
                      </motion.div>
                    );
                    })
                    )}
                  </div>
                </div>
                );
              })()}

              {/* Collapsible Help Section */}
              <div className="border border-blue-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowHelp(!showHelp)}
                  className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <Info className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">Connection Troubleshooting</span>
                  </div>
                  <motion.div
                    animate={{ rotate: showHelp ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </motion.div>
                </button>
                <AnimatePresence>
                  {showHelp && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white border-t border-blue-200"
                    >
                      <div className="p-4 space-y-3">
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-2">Common Issues & Solutions:</h4>
                          <ul className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span><strong>Authentication Failed:</strong> Make sure you're using an <strong>app password</strong>, not your regular password</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span><strong>2FA Required:</strong> Enable 2-Factor Authentication on your email account first</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span><strong>IMAP Disabled:</strong> Check that IMAP access is enabled in your email settings</span>
                            </li>
                            <li className="flex items-start space-x-2">
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span><strong>Password Spaces:</strong> Spaces are automatically removed when you paste your app password</span>
                            </li>
                          </ul>
                        </div>
                        <div className="pt-3 border-t border-gray-200">
                          <h4 className="font-semibold text-gray-800 mb-2">How to get an App Password:</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                            <a
                              href="https://support.google.com/accounts/answer/185833"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-900 font-medium transition-colors"
                            >
                              📧 Gmail Guide →
                            </a>
                            <a
                              href="https://support.microsoft.com/account-billing/manage-app-passwords-for-two-step-verification-d6dc8c6d-4bf7-4851-ad95-6d07799387e9"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-900 font-medium transition-colors"
                            >
                              📧 Outlook Guide →
                            </a>
                            <a
                              href="https://help.yahoo.com/kb/generate-manage-third-party-passwords-sln15241.html"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-900 font-medium transition-colors"
                            >
                              📧 Yahoo Guide →
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {!monitoringStatus.isActive ? (
                <div className="flex space-x-4">
                  <button
                    onClick={handleDisconnect}
                    className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStartMonitoring}
                    disabled={loading}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {loading ? (
                      <>
                        <Loader className="h-5 w-5 animate-spin" />
                        <span>Starting...</span>
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5" />
                        <span>Start Real-Time Monitoring</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                          <div className="absolute top-0 left-0 h-3 w-3 bg-green-500 rounded-full animate-ping"></div>
                        </div>
                        <div>
                          <p className="font-semibold text-green-900">Monitoring Active</p>
                          <p className="text-sm text-green-700">
                            Checking inbox every 2 minutes
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={async () => {
                            console.log('🔄 Manual refresh triggered');
                            await refreshResults();
                            setSuccess('✨ Results refreshed!');
                            setTimeout(() => setSuccess(''), 2000);
                          }}
                          disabled={loading || isRefreshing}
                          className="py-2 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center space-x-2"
                        >
                          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                          <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
                        </button>
                        <button
                          onClick={handleStopMonitoring}
                          disabled={loading}
                          className="py-2 px-4 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all disabled:opacity-50 flex items-center space-x-2"
                        >
                          {loading ? (
                            <>
                              <Loader className="h-4 w-4 animate-spin" />
                              <span>Stopping...</span>
                            </>
                          ) : (
                            <>
                              <Square className="h-4 w-4" />
                              <span>Stop</span>
                            </>
                          )}
                        </button>
                      </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-gray-800">{monitoringStatus.scansPerformed}</p>
                      <p className="text-sm text-gray-600">Emails Scanned</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-gray-800">
                        {monitoringStatus.lastCheck ? new Date(monitoringStatus.lastCheck).toLocaleTimeString() : '--:--'}
                      </p>
                      <p className="text-sm text-gray-600">Last Updated</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">Active</p>
                      <p className="text-sm text-gray-600">Status</p>
                    </div>
                  </div>


                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default EmailMonitoring;
