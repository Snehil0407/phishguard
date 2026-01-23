import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link as LinkIcon, Send, Loader2, ExternalLink } from 'lucide-react';
import { analyzeURL } from '../services/api';
import ResultCard from '../components/ResultCard';

const URLAnalysis = () => {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await analyzeURL(url);
      setResult(response);
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setUrl('');
    setResult(null);
    setError('');
  };

  const exampleURLs = [
    "http://paypal-secure-login.tk/verify.php?id=12345",
    "https://www.github.com/repository",
    "http://amaz0n-prize-winner.xyz/claim-now"
  ];

  const loadExample = (example) => {
    setUrl(example);
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mb-4 shadow-lg">
            <LinkIcon className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            URL Phishing Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Scan URLs for phishing and malicious content before clicking
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <form onSubmit={handleAnalyze} className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">URL to Analyze</h2>
              
              {/* URL Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Website URL *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com or http://suspicious-site.xyz"
                    className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    required
                  />
                  <LinkIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
                </div>
                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center mt-2 text-sm text-orange-600 hover:text-orange-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Preview in new tab (use caution)
                  </a>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
                >
                  {error}
                </motion.div>
              )}

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Analyze URL
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-all"
                >
                  Clear
                </button>
              </div>
            </form>

            {/* Example URLs */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-6"
            >
              <h3 className="font-semibold text-orange-900 mb-3">🔗 Try Example URLs</h3>
              <div className="space-y-2">
                {exampleURLs.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => loadExample(example)}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg text-sm text-gray-700 hover:bg-orange-100 transition-all border border-orange-100 break-all"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Safety Tips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-6 bg-red-50 border border-red-200 rounded-xl p-6"
            >
              <h3 className="font-semibold text-red-900 mb-3">⚠️ Safety Tips</h3>
              <ul className="space-y-2 text-sm text-red-800">
                <li>• Never visit suspicious URLs directly</li>
                <li>• Check for HTTPS and valid certificates</li>
                <li>• Verify domain spelling carefully</li>
                <li>• Avoid clicking links from unknown sources</li>
              </ul>
            </motion.div>
          </motion.div>

          {/* Result Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {loading || result ? (
              <ResultCard result={result} loading={loading} />
            ) : (
              <div className="bg-gradient-to-br from-gray-50 to-orange-50 rounded-2xl shadow-xl p-12 border border-gray-200 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="bg-white p-6 rounded-full mb-6 shadow-lg">
                  <LinkIcon className="h-16 w-16 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Ready to Analyze
                </h3>
                <p className="text-gray-600 max-w-sm">
                  Enter a URL or try an example to check if it's safe or a phishing site
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default URLAnalysis;
