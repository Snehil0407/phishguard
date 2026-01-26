import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { analyzeSMS } from '../services/api';
import ResultCard from '../components/ResultCard';
import { useAuth } from '../context/AuthContext';
import { saveScanResult } from '../services/scanService';
import { generateSMSPDF } from '../utils/pdfGenerator';

const SMSAnalysis = () => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    
    if (!message.trim()) {
      setError('Please enter SMS message');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await analyzeSMS(message);
      setResult(response);
      
      // Save scan result to Firebase if user is logged in
      if (currentUser) {
        console.log('User logged in, attempting to save SMS scan...');
        try {
          const scanData = {
            type: 'sms',
            message: message,
            content: message.substring(0, 200),
            result: response
          };
          console.log('SMS scan data:', scanData);
          const scanId = await saveScanResult(currentUser.uid, scanData);
          console.log('SMS scan saved with ID:', scanId);
        } catch (saveErr) {
          console.error('Failed to save SMS scan:', saveErr);
          console.error('Error details:', saveErr.message);
        }
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessage('');
    setResult(null);
    setError('');
  };

  const handleDownloadPDF = () => {
    console.log('Download SMS PDF button clicked');
    console.log('Current result:', result);
    console.log('Current message:', message);
    
    if (result) {
      generateSMSPDF({
        message,
        result
      });
    } else {
      console.error('No result available to generate PDF');
    }
  };

  const exampleMessages = [
    "CONGRATULATIONS! You've won a $1000 Walmart gift card. Claim now: bit.ly/prize123",
    "Your package delivery failed. Update your address here: track-parcel.xyz/update",
    "Hey! Just wanted to remind you about our lunch meeting tomorrow at 1pm."
  ];

  const loadExample = (example) => {
    setMessage(example);
    setResult(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl mb-4 shadow-lg">
            <MessageSquare className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            SMS Phishing Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Check if your text messages are legitimate or smishing attempts
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
              <h2 className="text-2xl font-bold text-gray-800 mb-6">SMS Message</h2>
              
              {/* Message Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message Content *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Paste your SMS message here..."
                  rows="8"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
                  required
                ></textarea>
                <p className="text-sm text-gray-500 mt-2">
                  {message.length} characters
                </p>
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
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Analyze SMS
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

            {/* Example Messages */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-6"
            >
              <h3 className="font-semibold text-purple-900 mb-3">📝 Try Example Messages</h3>
              <div className="space-y-2">
                {exampleMessages.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => loadExample(example)}
                    className="w-full text-left px-4 py-3 bg-white rounded-lg text-sm text-gray-700 hover:bg-purple-100 transition-all border border-purple-100"
                  >
                    {example.substring(0, 60)}...
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* Result Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {loading || result ? (
              <ResultCard 
                result={result} 
                loading={loading}
                scanType="sms"
                scanData={{ message }}
                onDownloadPDF={result ? handleDownloadPDF : null}
              />
            ) : (
              <div className="bg-gradient-to-br from-gray-50 to-purple-50 rounded-2xl shadow-xl p-12 border border-gray-200 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="bg-white p-6 rounded-full mb-6 shadow-lg">
                  <MessageSquare className="h-16 w-16 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Ready to Analyze
                </h3>
                <p className="text-gray-600 max-w-sm">
                  Enter an SMS message or try an example to get instant phishing detection results
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SMSAnalysis;
