import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, AlertCircle, Info } from 'lucide-react';

const ResultCard = ({ result, loading }) => {
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
            
            {/* Detected Indicators */}
            <div>
              <h5 className="font-semibold text-gray-700 mb-3">Detected Indicators:</h5>
              <div className="space-y-3">
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

                {result.explanation.url_count !== undefined && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <div className={`h-2 w-2 rounded-full ${result.explanation.url_count > 0 ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                      <span className="text-gray-700">URLs/Links Detected</span>
                    </div>
                    <span className={`font-semibold ${result.explanation.url_count > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {result.explanation.url_count}
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

            {/* Suspicious Email Indicators */}
            {result.explanation.red_flags_summary && (() => {
              console.log('=== RED FLAGS DEBUG ===');
              console.log('red_flags_summary:', result.explanation.red_flags_summary);
              console.log('red_flag_count:', result.explanation.red_flag_count);
              
              // Comprehensive mapping of ALL 40 red flags with descriptions
              const redFlagDescriptions = {
                misspelled_domain: "Misspelled or suspicious domain detected",
                free_email_provider: "Using free email provider for official communication",
                suspicious_tld: "Suspicious top-level domain (.tk, .ml, .xyz, etc.)",
                random_email_pattern: "Random or suspicious email pattern detected",
                display_name_mismatch: "Display name doesn't match sender email",
                missing_spf: "Missing SPF email authentication",
                missing_dkim: "Missing DKIM email authentication",
                missing_dmarc: "Missing DMARC email authentication",
                failed_spf: "Failed SPF authentication check",
                failed_dkim: "Failed DKIM authentication check",
                reply_to_different: "Reply-to address differs from sender",
                suspicious_headers: "Suspicious or manipulated email headers",
                email_spoofing: "Email spoofing attempt detected",
                credential_request: "Requesting login credentials or passwords",
                payment_request: "Requesting unusual payment information",
                sensitive_info_request: "Requesting sensitive personal information",
                macro_request: "Requesting to enable macros or scripts",
                account_verification_request: "Requesting account verification",
                generic_greeting: "Generic greeting (Dear User/Customer)",
                poor_grammar: "Poor grammar or unusual phrasing detected",
                urgency_detected: "Urgent or threatening language detected",
                spelling_errors: "Multiple spelling errors detected",
                unusual_formatting: "Unusual or suspicious formatting",
                impersonation_detected: "Attempting to impersonate legitimate organization",
                logo_misuse: "Suspicious or altered logo usage",
                inconsistent_branding: "Inconsistent branding with claimed organization",
                suspicious_links: "Links don't match claimed organization",
                branded_domain_mismatch: "Domain doesn't match brand",
                unexpected_payment_request: "Unexpected or unusual payment request",
                qr_code_mention: "Suspicious QR code for payment/login",
                crypto_payment_request: "Requesting cryptocurrency payment",
                tax_authority_impersonation: "Impersonating tax authority",
                legal_threat: "Legal threats or law enforcement impersonation",
                suspicious_attachments: "Suspicious file attachments detected",
                shortened_urls: "Shortened URLs detected (bit.ly, tinyurl, etc.)",
                ip_address_in_url: "IP address used instead of domain name",
                emotional_manipulation: "Emotional manipulation tactics detected",
                too_good_offer: "Too-good-to-be-true offers detected",
                pressure_tactics: "Pressure tactics with rewards or threats",
                compromise_claim: "Claims your account has been compromised",
                bypass_security_request: "Asking to bypass security measures",
                grammar_issues: "Consistent grammar or language issues"
              };

              // Build array of matched indicators
              const matchedIndicators = [];
              const summary = result.explanation.red_flags_summary;
              
              // Check each flag in the descriptions
              for (const [flag, description] of Object.entries(redFlagDescriptions)) {
                const flagValue = summary[flag];
                console.log(`Flag "${flag}": value =`, flagValue, `type = ${typeof flagValue}`);
                
                // Check if flag is true (boolean) or truthy (but not arrays like urgency_phrases)
                if (flagValue === true || (flagValue && typeof flagValue === 'boolean')) {
                  matchedIndicators.push({
                    key: flag,
                    description: description
                  });
                  console.log(`  ✓ Matched: ${flag}`);
                }
              }
              
              console.log('Matched indicators:', matchedIndicators);
              console.log('Matched count:', matchedIndicators.length);
              console.log('Red flag count from API:', result.explanation.red_flag_count);

              // Show the section even if no matched indicators, to display count mismatch warning
              if (matchedIndicators.length === 0 && result.explanation.red_flag_count > 0) {
                console.log('Count mismatch! red_flag_count > 0 but no matched indicators');
                // Show all flags with their values for debugging
                console.log('All flags and values:', summary);
              }

              // Always show section if red_flag_count > 0, even if we can't match the flags
              if (matchedIndicators.length === 0 && result.explanation.red_flag_count === 0) {
                return null;
              }

              return (
                <div className="mt-4">
                  <h5 className="font-semibold text-gray-700 mb-3">
                    🚨 Suspicious Email Indicators Detected:
                  </h5>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    {matchedIndicators.length > 0 ? (
                      <ul className="space-y-2.5">
                        {matchedIndicators.map((indicator, idx) => (
                          <li key={idx} className="flex items-start space-x-3">
                            <span className="text-red-600 mt-0.5 text-lg">⚠️</span>
                            <div className="flex-1">
                              <span className="text-red-700 text-sm font-medium">{indicator.description}</span>
                              {indicator.key === 'urgency_detected' && summary.urgency_phrases && summary.urgency_phrases.length > 0 && (
                                <div className="mt-1.5 flex flex-wrap gap-1">
                                  {summary.urgency_phrases.map((phrase, pidx) => (
                                    <span key={pidx} className="px-2 py-0.5 bg-red-200 text-red-800 rounded text-xs font-medium">
                                      "{phrase}"
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-600">
                        <p className="mb-2">⚠️ {result.explanation.red_flag_count} suspicious indicators detected, but details are unavailable.</p>
                        <p className="text-xs text-gray-500">Check console for technical details.</p>
                      </div>
                    )}
                    
                    {result.explanation.red_flag_count >= 3 && (
                      <div className="mt-4 pt-3 border-t border-red-300">
                        <p className="text-sm text-red-700 font-semibold flex items-center">
                          <span className="text-lg mr-2">⛔</span>
                          Multiple suspicious indicators detected - This email is classified as PHISHING
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Found URLs */}
            {result.explanation.urls_found && result.explanation.urls_found.length > 0 && (
              <div className="mt-4">
                <h5 className="font-semibold text-gray-700 mb-3">🔗 Links Found:</h5>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
                  {result.explanation.urls_found.map((url, index) => (
                    <div key={index} className="flex items-start space-x-2 text-sm">
                      <span className="text-orange-600 font-mono break-all">{url}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suspicious URLs */}
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
