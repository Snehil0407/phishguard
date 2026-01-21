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
            
            {result.explanation.reason && (
              <div className={`border-l-4 ${severityConfig.border} bg-gray-50 p-4 rounded-r-lg`}>
                <p className="text-gray-700">{result.explanation.reason}</p>
              </div>
            )}

            {result.explanation.indicators && result.explanation.indicators.length > 0 && (
              <div>
                <h5 className="font-semibold text-gray-700 mb-2">Detected Indicators:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {result.explanation.indicators.map((indicator, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-2 text-gray-600"
                    >
                      <div className={`h-2 w-2 rounded-full ${result.is_phishing ? 'bg-red-500' : 'bg-green-500'}`}></div>
                      <span className="text-sm">{indicator}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {result.explanation.features && (
              <div className="mt-4">
                <h5 className="font-semibold text-gray-700 mb-2">Feature Analysis:</h5>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  {Object.entries(result.explanation.features).map(([key, value], index) => (
                    <div key={index} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}</span>
                      <span className="font-semibold text-gray-800">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Model Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Model: {result.model_type.toUpperCase()}</span>
            <span>Algorithm: XGBoost</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ResultCard;
