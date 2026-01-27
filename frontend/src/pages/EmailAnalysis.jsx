import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Send, Loader2 } from 'lucide-react';
import { analyzeEmail } from '../services/api';
import ResultCard from '../components/ResultCard';
import { useAuth } from '../context/AuthContext';
import { saveScanResult } from '../services/scanService';
import { generateEmailPDF } from '../utils/pdfGenerator';

const EmailAnalysis = () => {
  const { currentUser } = useAuth();
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async (e) => {
    e.preventDefault();
    
    if (!subject.trim()) {
      setError('Please enter email subject');
      return;
    }
    
    if (!content.trim()) {
      setError('Please enter email content');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await analyzeEmail(content, subject, senderEmail);
      setResult(response);
      
      // Save scan result to Firebase if user is logged in
      if (currentUser) {
        console.log('User logged in, attempting to save scan...', currentUser.uid);
        try {
          const scanData = {
            type: 'email',
            subject: subject,
            senderEmail: senderEmail,
            content: content.substring(0, 200),
            result: response
          };
          console.log('Scan data to save:', scanData);
          const scanId = await saveScanResult(currentUser.uid, scanData);
          console.log('Scan saved successfully with ID:', scanId);
        } catch (saveErr) {
          console.error('Failed to save scan result:', saveErr);
          console.error('Error details:', saveErr.message, saveErr.stack);
        }
      } else {
        console.log('No user logged in, skipping save');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setSubject('');
    setContent('');
    setSenderEmail('');
    setResult(null);
    setError('');
  };

  const handleDownloadPDF = () => {
    console.log('Download PDF button clicked');
    console.log('Current result:', result);
    console.log('Current subject:', subject);
    console.log('Current content length:', content?.length);
    console.log('Current user:', currentUser);
    
    if (result) {
      const userInfo = currentUser ? {
        userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        userEmail: currentUser.email
      } : null;
      
      generateEmailPDF({
        subject,
        senderEmail,
        content,
        result
      }, userInfo);
    } else {
      console.error('No result available to generate PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
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
            Email Phishing Analysis
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Paste your email content below to check if it's a phishing attempt using our advanced AI models
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
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Email Details</h2>
              
              {/* Sender Email Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sender Email Address *
                </label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="e.g., security@paypal.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  💡 Sender email is a key indicator for detecting phishing attempts
                </p>
              </div>
              
              {/* Subject Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Subject *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Urgent: Account Verification Required"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              {/* Content Input */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Content *
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste the full email content here..."
                  rows="8"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  required
                ></textarea>
                <p className="text-sm text-gray-500 mt-2">
                  {content.length} characters
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
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-5 w-5" />
                      Analyze Email
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

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-6"
            >
              <h3 className="font-semibold text-blue-900 mb-3">💡 Tips for Best Results</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>• Keep original formatting and links intact</li>
                <li>• The system will automatically detect suspicious keywords and URLs</li>
                <li>• Links found in the email will be analyzed for phishing</li>
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
              <ResultCard 
                result={result} 
                loading={loading}
                scanType="email"
                scanData={{ subject, senderEmail, content }}
                onDownloadPDF={result ? handleDownloadPDF : null}
              />
            ) : (
              <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl shadow-xl p-12 border border-gray-200 flex flex-col items-center justify-center text-center min-h-[400px]">
                <div className="bg-white p-6 rounded-full mb-6 shadow-lg">
                  <Mail className="h-16 w-16 text-gray-400" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  Ready to Analyze
                </h3>
                <p className="text-gray-600 max-w-sm">
                  Enter email content on the left and click "Analyze Email" to get instant phishing detection results
                </p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default EmailAnalysis;
