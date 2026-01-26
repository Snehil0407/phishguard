import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ResultCard = ({ result, loading }) => {
  // Debug logging
  if (result) {
    console.log('ResultCard received result:', result);
    console.log('is_phishing:', result.is_phishing);
    if (result.explanation) {
      console.log('Red flags:', result.explanation.red_flags);
      console.log('Red flags count:', result.explanation.red_flag_count);
      console.log('Green flags:', result.explanation.green_flags);
      console.log('Green flags count:', result.explanation.green_flag_count);
    }
  }
  
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100"
      >
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg">Analyzing with AI models...</p>
        </div>
      </motion.div>
    );
  }

  if (!result) return null;

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return {
          bg: 'from-red-500 to-red-600',
          text: 'text-red-600',
          border: 'border-red-200',
          icon: AlertTriangle
        };
      case 'high':
        return {
          bg: 'from-orange-500 to-red-500',
          text: 'text-orange-600',
          border: 'border-orange-200',
          icon: AlertCircle
        };
      case 'medium':
        return {
          bg: 'from-yellow-500 to-orange-500',
          text: 'text-yellow-600',
          border: 'border-yellow-200',
          icon: AlertCircle
        };
      case 'low':
        return {
          bg: 'from-green-500 to-green-600',
          text: 'text-green-600',
          border: 'border-green-200',
          icon: CheckCircle
        };
      default:
        return {
          bg: 'from-gray-500 to-gray-600',
          text: 'text-gray-600',
          border: 'border-gray-200',
          icon: Info
        };
    }
  };

  const severityConfig = getSeverityColor(result.severity);
  const Icon = severityConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100"
    >
      {/* Header */}
      <div className={`bg-gradient-to-r ${severityConfig.bg} p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Icon className="h-8 w-8" />
            <div>
              <h3 className="text-2xl font-bold">
                {result.is_phishing ? 'Phishing Detected!' : 'Content is Safe'}
              </h3>
              <p className="text-white/90">
                {result.severity.charAt(0).toUpperCase() + result.severity.slice(1)} Risk Level
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{result.risk_score}</div>
            <div className="text-sm text-white/90">Risk Score</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-8">
        {/* Confidence Meter */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-700 font-semibold">Confidence Level</span>
            <span className={`${severityConfig.text} font-bold`}>
              {(result.confidence * 100).toFixed(2)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${result.confidence * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={`h-3 bg-gradient-to-r ${severityConfig.bg} rounded-full`}
            ></motion.div>
          </div>
        </div>

        {/* Explanation */}
        {result.explanation && (
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-gray-800 mb-3">Analysis Details</h4>
            
            {/* Red Flags for URL Analysis - Show ONLY if phishing detected */}
            {result.is_phishing && result.explanation.red_flags && Array.isArray(result.explanation.red_flags) && result.explanation.red_flags.length > 0 && (
              <div className="mb-6">
                <h5 className="font-semibold text-gray-700 mb-3">🚨 Phishing Indicators Detected ({result.explanation.red_flag_count}/40):</h5>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {result.explanation.red_flags.map((flag, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center space-x-2"
                      >
                        <span className="text-red-500">✗</span>
                        <span className="text-red-700 text-sm font-medium">{flag}</span>
                      </motion.div>
                    ))}
                  </div>
                  {result.explanation.red_flag_count > result.explanation.red_flags.length && (
                    <p className="text-red-600 text-sm mt-3 italic">
                      ... and {result.explanation.red_flag_count - result.explanation.red_flags.length} more warning signs
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Green Flags for URL Analysis - Show ONLY if safe */}
            {!result.is_phishing && result.explanation.green_flags && Array.isArray(result.explanation.green_flags) && result.explanation.green_flags.length > 0 && (
              <div className="mb-6">
                <h5 className="font-semibold text-gray-700 mb-3">✅ Safety Indicators ({result.explanation.green_flag_count}/40):</h5>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {result.explanation.green_flags.slice(0, 8).map((flag, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center space-x-2"
                      >
                        <span className="text-green-500">✓</span>
                        <span className="text-green-700 text-sm font-medium">{flag}</span>
                      </motion.div>
                    ))}
                  </div>
                  {result.explanation.green_flag_count > 8 && (
                    <p className="text-green-600 text-sm mt-3 italic">
                      ... and {result.explanation.green_flag_count - 8} more positive indicators
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Detected Indicators (for Email/SMS) */}
            <div>
              <h5 className="font-semibold text-gray-700 mb-3">Detected Indicators:</h5>
              <div className="space-y-3">
                {/* Suspicious Sender Email - Show ONLY if phishing detected and email has suspicious flags */}
                {result.is_phishing && result.explanation.red_flags_summary && (
                  result.explanation.red_flags_summary.misspelled_domain ||
                  result.explanation.red_flags_summary.free_email_provider ||
                  result.explanation.red_flags_summary.suspicious_tld ||
                  result.explanation.red_flags_summary.random_email_pattern ||
                  result.explanation.red_flags_summary.display_name_mismatch ||
                  result.explanation.red_flags_summary.email_spoofing
                ) && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between bg-red-50 border border-red-200 p-3 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-red-500"></div>
                      <span className="text-gray-700 font-medium">⚠️ Suspicious Sender Email Address</span>
                    </div>
                    <span className="font-semibold text-red-600">
                      {[
                        result.explanation.red_flags_summary.misspelled_domain && 'Misspelled',
                        result.explanation.red_flags_summary.free_email_provider && 'Free Provider',
                        result.explanation.red_flags_summary.suspicious_tld && 'Suspicious TLD',
                        result.explanation.red_flags_summary.random_email_pattern && 'Random Pattern',
                        result.explanation.red_flags_summary.display_name_mismatch && 'Name Mismatch',
                        result.explanation.red_flags_summary.email_spoofing && 'Spoofed'
                      ].filter(Boolean).join(', ')}
                    </span>
                  </motion.div>
                )}

                {result.explanation.phishing_keywords !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${result.explanation.phishing_keywords > 0 ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <span className="text-gray-700">Suspicious Keywords Found</span>
                    </div>
                    <span className={`font-semibold ${result.explanation.phishing_keywords > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {result.explanation.phishing_keywords}
                    </span>
                  </motion.div>
                )}

                {/* Only show URL indicator if there are SUSPICIOUS URLs */}
                {result.explanation.suspicious_urls && result.explanation.suspicious_urls.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-red-500"></div>
                      <span className="text-gray-700">Malicious URLs Detected</span>
                    </div>
                    <span className="font-semibold text-red-600">
                      {result.explanation.suspicious_urls.length}
                    </span>
                  </motion.div>
                )}

                {result.explanation.uppercase_ratio !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${result.explanation.uppercase_ratio > 30 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                      <span className="text-gray-700">Uppercase Text Ratio</span>
                    </div>
                    <span className={`font-semibold ${result.explanation.uppercase_ratio > 30 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {result.explanation.uppercase_ratio.toFixed(1)}%
                    </span>
                  </motion.div>
                )}

                {result.explanation.text_length !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span className="text-gray-700">Content Length</span>
                    </div>
                    <span className="font-semibold text-blue-600">
                      {result.explanation.text_length} chars
                    </span>
                  </motion.div>
                )}

                {result.explanation.has_ip !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${result.explanation.has_ip ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <span className="text-gray-700">IP Address in URL</span>
                    </div>
                    <span className={`font-semibold ${result.explanation.has_ip ? 'text-red-600' : 'text-green-600'}`}>
                      {result.explanation.has_ip ? 'Yes' : 'No'}
                    </span>
                  </motion.div>
                )}

                {result.explanation.suspicious_tld !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${result.explanation.suspicious_tld ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <span className="text-gray-700">Suspicious Domain</span>
                    </div>
                    <span className={`font-semibold ${result.explanation.suspicious_tld ? 'text-red-600' : 'text-green-600'}`}>
                      {result.explanation.suspicious_tld ? 'Yes' : 'No'}
                    </span>
                  </motion.div>
                )}

                {result.explanation.url_length !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${result.explanation.url_length > 75 ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
                      <span className="text-gray-700">URL Length</span>
                    </div>
                    <span className={`font-semibold ${result.explanation.url_length > 75 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {result.explanation.url_length} chars
                    </span>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Found Keywords */}
            {result.explanation.keywords_found && result.explanation.keywords_found.length > 0 && (
              <div className="mt-4">
                <h5 className="font-semibold text-gray-700 mb-3">🔍 Suspicious Keywords Detected:</h5>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex flex-wrap gap-2">
                    {result.explanation.keywords_found.map((keyword, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Suspicious URLs - ONLY show if URLs are CONFIRMED malicious by URL scanner */}
            {result.explanation.suspicious_urls && result.explanation.suspicious_urls.length > 0 && (
              <div className="mt-4">
                <h5 className="font-semibold text-gray-700 mb-3">⚠️ Suspicious Links Detected:</h5>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                  {result.explanation.suspicious_urls.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-red-700 font-mono text-sm break-all flex-1">{item.url}</span>
                      <span className="ml-3 px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-semibold whitespace-nowrap">
                        Risk: {item.risk}%
                      </span>
                    </div>
                  ))}
                  <p className="text-sm text-red-600 mt-2">
                    ⚠️ These URLs were analyzed and flagged as potentially malicious. Do NOT click them!
                  </p>
                </div>
              </div>
            )}

            {/* Safe URLs - Show verified safe URLs */}
            {result.explanation.safe_urls && result.explanation.safe_urls.length > 0 && (
              <div className="mt-4">
                <h5 className="font-semibold text-gray-700 mb-3">✅ Safe Links Verified:</h5>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                  {result.explanation.safe_urls.map((url, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <span className="text-green-600">✓</span>
                      <span className="text-green-700 font-mono text-sm break-all">{url}</span>
                    </div>
                  ))}
                  <p className="text-sm text-green-600 mt-2">
                    ✓ These URLs were scanned and confirmed to be safe.
                  </p>
                </div>
              </div>
            )}

            {/* Safety Recommendation */}
            <div className={`border-l-4 ${severityConfig.border} bg-gray-50 p-4 rounded-r-lg mt-4`}>
              <p className="font-semibold text-gray-800 mb-2">
                {result.is_phishing ? '⚠️ Recommendation:' : '✅ Safety Check:'}
              </p>
              <p className="text-gray-700">
                {result.is_phishing 
                  ? 'This content shows signs of phishing. Do not click any links, provide personal information, or respond. Delete it immediately and report if possible.'
                  : 'This content appears to be legitimate. However, always verify sender identity and be cautious with sensitive information.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ResultCard;
