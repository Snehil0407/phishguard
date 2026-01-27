import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, AlertTriangle, CheckCircle, Mail, MessageSquare, Link as LinkIcon, Calendar, Clock, TrendingUp, Download, Info } from 'lucide-react';

const ScanDetailsModal = ({ isOpen, onClose, scan }) => {
  if (!scan) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'email':
        return Mail;
      case 'sms':
        return MessageSquare;
      case 'url':
        return LinkIcon;
      default:
        return Shield;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'email':
        return {
          gradient: 'from-blue-500 to-blue-600',
          bg: 'bg-blue-50',
          text: 'text-blue-700',
          border: 'border-blue-200'
        };
      case 'sms':
        return {
          gradient: 'from-purple-500 to-purple-600',
          bg: 'bg-purple-50',
          text: 'text-purple-700',
          border: 'border-purple-200'
        };
      case 'url':
        return {
          gradient: 'from-orange-500 to-orange-600',
          bg: 'bg-orange-50',
          text: 'text-orange-700',
          border: 'border-orange-200'
        };
      default:
        return {
          gradient: 'from-gray-500 to-gray-600',
          bg: 'bg-gray-50',
          text: 'text-gray-700',
          border: 'border-gray-200'
        };
    }
  };

  const TypeIcon = getTypeIcon(scan.type);
  const colors = getTypeColor(scan.type);
  const isPhishing = scan.result === 'phishing' || scan.isPhishing;
  const confidence = scan.confidence || scan.risk || 0;
  const severity = scan.fullResult?.severity || 
                  (confidence >= 70 ? 'high' : confidence >= 40 ? 'medium' : 'low');

  const getSeverityColor = (sev) => {
    switch (sev) {
      case 'high':
        return 'text-red-600 bg-red-100';
      case 'medium':
        return 'text-orange-600 bg-orange-100';
      case 'low':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${colors.gradient} p-6 text-white relative`}>
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
                
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <TypeIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Scan Details</h2>
                    <p className="text-white/80 text-sm capitalize">{scan.type} Analysis</p>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Status Banner */}
                <div className={`mb-6 p-4 rounded-xl flex items-center justify-between ${
                  isPhishing ? 'bg-red-50 border-2 border-red-200' : 'bg-green-50 border-2 border-green-200'
                }`}>
                  <div className="flex items-center space-x-3">
                    {isPhishing ? (
                      <AlertTriangle className="h-8 w-8 text-red-600" />
                    ) : (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    )}
                    <div>
                      <h3 className={`text-xl font-bold ${isPhishing ? 'text-red-700' : 'text-green-700'}`}>
                        {isPhishing ? 'Phishing Detected' : 'Safe Content'}
                      </h3>
                      <p className={`text-sm ${isPhishing ? 'text-red-600' : 'text-green-600'}`}>
                        Confidence: {confidence}%
                      </p>
                    </div>
                  </div>
                  <div className={`px-4 py-2 rounded-lg font-semibold capitalize ${getSeverityColor(severity)}`}>
                    {severity} Risk
                  </div>
                </div>

                {/* Scan Information */}
                <div className="space-y-4">
                  {/* Content Display */}
                  <div className={`p-4 rounded-xl border-2 ${colors.border} ${colors.bg}`}>
                    <h4 className={`font-semibold ${colors.text} mb-2 flex items-center`}>
                      <Info className="h-4 w-4 mr-2" />
                      Scanned Content
                    </h4>
                    <div className="bg-white rounded-lg p-3 max-h-32 overflow-y-auto">
                      {scan.type === 'email' && (
                        <div>
                          {scan.subject && (
                            <div className="mb-2">
                              <span className="font-semibold text-gray-700">Subject: </span>
                              <span className="text-gray-900">{scan.subject}</span>
                            </div>
                          )}
                          {scan.senderEmail && (
                            <div className="mb-2">
                              <span className="font-semibold text-gray-700">From: </span>
                              <span className="text-gray-900">{scan.senderEmail}</span>
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-gray-700">Content: </span>
                            <span className="text-gray-900">{scan.fullContent || scan.content}</span>
                          </div>
                        </div>
                      )}
                      {scan.type === 'sms' && (
                        <p className="text-gray-900">{scan.message || scan.content}</p>
                      )}
                      {scan.type === 'url' && (
                        <p className="text-gray-900 break-all">{scan.url || scan.content}</p>
                      )}
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div className="flex items-center text-gray-600 mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span className="text-sm font-semibold">Scan Date</span>
                      </div>
                      <p className="text-gray-900 font-medium">{scan.time}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div className="flex items-center text-gray-600 mb-2">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        <span className="text-sm font-semibold">Risk Score</span>
                      </div>
                      <p className={`text-2xl font-bold ${
                        confidence >= 70 ? 'text-red-600' :
                        confidence >= 40 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {confidence}%
                      </p>
                    </div>
                  </div>

                  {/* Indicators Summary - Show based on result */}
                  {scan.fullResult?.explanation && (
                    <>
                      {/* Show Red Flags only if Phishing */}
                      {isPhishing && scan.fullResult.explanation.red_flag_count !== undefined && (
                        <div className="bg-red-50 p-4 rounded-xl border-2 border-red-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-red-700 flex items-center">
                              <AlertTriangle className="h-4 w-4 mr-2" />
                              🚨 Phishing Indicators Detected
                            </h4>
                            <span className="text-2xl font-bold text-red-600">
                              {scan.fullResult.explanation.red_flag_count}
                            </span>
                          </div>
                          {scan.fullResult.explanation.red_flags && 
                           scan.fullResult.explanation.red_flags.length > 0 && (
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {scan.fullResult.explanation.red_flags.slice(0, 8).map((flag, idx) => (
                                <div key={idx} className="text-xs text-red-700 flex items-start bg-white p-2 rounded">
                                  <span className="mr-2 font-bold">•</span>
                                  <span>{flag}</span>
                                </div>
                              ))}
                              {scan.fullResult.explanation.red_flags.length > 8 && (
                                <p className="text-xs text-red-600 font-semibold mt-2 bg-red-100 p-2 rounded">
                                  ...and {scan.fullResult.explanation.red_flags.length - 8} more warning signs
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show Green Flags only if Safe */}
                      {!isPhishing && scan.fullResult.explanation.green_flag_count !== undefined && (
                        <div className="bg-green-50 p-4 rounded-xl border-2 border-green-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-green-700 flex items-center">
                              <CheckCircle className="h-4 w-4 mr-2" />
                              ✅ Safety Indicators
                            </h4>
                            <span className="text-2xl font-bold text-green-600">
                              {scan.fullResult.explanation.green_flag_count}
                            </span>
                          </div>
                          {scan.fullResult.explanation.green_flags && 
                           scan.fullResult.explanation.green_flags.length > 0 && (
                            <div className="space-y-1 max-h-48 overflow-y-auto">
                              {scan.fullResult.explanation.green_flags.slice(0, 8).map((flag, idx) => (
                                <div key={idx} className="text-xs text-green-700 flex items-start bg-white p-2 rounded">
                                  <span className="mr-2 font-bold">•</span>
                                  <span>{flag}</span>
                                </div>
                              ))}
                              {scan.fullResult.explanation.green_flags.length > 8 && (
                                <p className="text-xs text-green-600 font-semibold mt-2 bg-green-100 p-2 rounded">
                                  ...and {scan.fullResult.explanation.green_flags.length - 8} more positive indicators
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {/* Additional Details */}
                  {scan.fullResult?.explanation && (
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <h4 className="font-semibold text-blue-700 mb-3">Analysis Details</h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {scan.fullResult.explanation.phishing_keywords !== undefined && (
                          <div>
                            <span className="text-gray-600">Phishing Keywords: </span>
                            <span className="font-semibold text-gray-900">
                              {scan.fullResult.explanation.phishing_keywords}
                            </span>
                          </div>
                        )}
                        {scan.fullResult.explanation.url_count !== undefined && (
                          <div>
                            <span className="text-gray-600">URLs Found: </span>
                            <span className="font-semibold text-gray-900">
                              {scan.fullResult.explanation.url_count}
                            </span>
                          </div>
                        )}
                        {scan.fullResult.explanation.suspicious_urls && 
                         scan.fullResult.explanation.suspicious_urls.length > 0 && (
                          <div className="col-span-2">
                            <span className="text-gray-600">Suspicious URLs: </span>
                            <span className="font-semibold text-red-600">
                              {scan.fullResult.explanation.suspicious_urls.length}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2 rounded-lg border-2 border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ScanDetailsModal;
