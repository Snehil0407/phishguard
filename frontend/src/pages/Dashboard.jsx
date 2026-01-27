import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Shield, Mail, MessageSquare, Link as LinkIcon, 
  TrendingUp, AlertTriangle, CheckCircle, BarChart3,
  Clock, Zap, ArrowRight, Loader2, Download, Trash2,
  Search, Filter, X, Calendar, PieChart, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserStats, getRecentScans, deleteScanResult } from '../services/scanService';
import { generateEmailPDF, generateSMSPDF, generateURLPDF } from '../utils/pdfGenerator';
import ConfirmModal from '../components/ConfirmModal';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalScans: 0,
    threatsDetected: 0,
    safeContent: 0,
    todayScans: 0
  });
  const [recentScans, setRecentScans] = useState([]);
  const [filteredScans, setFilteredScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, scanId: null });
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterResult, setFilterResult] = useState('all');

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }

      try {
        // Load user statistics
        const userStats = await getUserStats(currentUser.uid);
        setStats(userStats);

        // Load recent scans
        const scans = await getRecentScans(currentUser.uid, 5);
        console.log('Loaded scans:', scans); // Debug log
        const formattedScans = scans.map(scan => {
          // Handle different content types
          let displayContent = '';
          if (scan.type === 'email') {
            displayContent = scan.subject || scan.content || 'Email scan';
          } else if (scan.type === 'sms') {
            displayContent = scan.message || scan.content || 'SMS scan';
          } else if (scan.type === 'url') {
            displayContent = scan.url || scan.content || 'URL scan';
          }
          
          return {
            id: scan.id,
            type: scan.type,
            content: displayContent,
            result: scan.result.isPhishing ? 'phishing' : 'safe',
            risk: Math.round((scan.result.confidence || 0) * 100),
            time: formatTimestamp(scan.createdAt || scan.timestamp),
            // Store ALL data for PDF generation
            subject: scan.subject,
            senderEmail: scan.senderEmail,
            message: scan.message,
            url: scan.url,
            fullContent: scan.content,
            fullResult: {
              is_phishing: scan.result.isPhishing,
              confidence: scan.result.confidence,
              risk_score: scan.result.riskScore,
              severity: scan.result.severity,
              explanation: scan.explanation
            }
          };
        });
        setRecentScans(formattedScans);
        setFilteredScans(formattedScans);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser]);

  // Filter scans based on search and filters
  useEffect(() => {
    let filtered = [...recentScans];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(scan =>
        scan.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(scan => scan.type === filterType);
    }

    // Apply result filter
    if (filterResult !== 'all') {
      filtered = filtered.filter(scan => scan.result === filterResult);
    }

    setFilteredScans(filtered);
  }, [searchTerm, filterType, filterResult, recentScans]);

  const handleDownloadPDF = async (scan) => {
    setDownloadingId(scan.id);
    
    const userInfo = currentUser ? {
      userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
      userEmail: currentUser.email
    } : null;

    try {
      // Add a small delay for animation effect
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (scan.type === 'email') {
        generateEmailPDF({
          subject: scan.subject || scan.content,
          senderEmail: scan.senderEmail || '',
          content: scan.fullContent || scan.content || '',
          result: scan.fullResult
        }, userInfo);
      } else if (scan.type === 'sms') {
        generateSMSPDF({
          message: scan.message || scan.fullContent || scan.content,
          result: scan.fullResult
        }, userInfo);
      } else if (scan.type === 'url') {
        generateURLPDF({
          url: scan.url || scan.content,
          result: scan.fullResult
        }, userInfo);
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteScan = async () => {
    const scanId = deleteModal.scanId;
    if (!scanId) return;

    setDeletingId(scanId);
    
    try {
      // Add animation delay
      await new Promise(resolve => setTimeout(resolve, 300));
      await deleteScanResult(scanId);
      setRecentScans(prev => prev.filter(scan => scan.id !== scanId));
      // Update stats
      const userStats = await getUserStats(currentUser.uid);
      setStats(userStats);
    } catch (error) {
      console.error('Error deleting scan:', error);
      alert('Failed to delete scan. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    // Handle both Firestore Timestamp and Date objects
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return 'Just now';
    }
    
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const quickActions = [
    {
      title: 'Email Analysis',
      description: 'Check emails for phishing',
      icon: Mail,
      color: 'from-blue-500 to-cyan-500',
      link: '/email-analysis'
    },
    {
      title: 'SMS Analysis',
      description: 'Scan text messages',
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-500',
      link: '/sms-analysis'
    },
    {
      title: 'URL Analysis',
      description: 'Verify website safety',
      icon: LinkIcon,
      color: 'from-orange-500 to-red-500',
      link: '/url-analysis'
    }
  ];

  const getTypeIcon = (type) => {
    switch (type) {
      case 'email': return Mail;
      case 'sms': return MessageSquare;
      case 'url': return LinkIcon;
      default: return Shield;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Welcome to Your Dashboard
          </h1>
          <p className="text-xl text-gray-600">
            Monitor your security analysis and detect threats in real-time
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        )}

        {/* Dashboard Content */}
        {!loading && currentUser && (
        <>
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <motion.div 
                className="bg-blue-100 p-3 rounded-xl"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </motion.div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <motion.div 
              className="text-3xl font-bold text-gray-800 mb-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              {stats.totalScans}
            </motion.div>
            <div className="text-sm text-gray-600">Total Scans</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <motion.div 
                className="bg-red-100 p-3 rounded-xl"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </motion.div>
              <motion.span 
                className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold"
                whileHover={{ scale: 1.1 }}
              >
                {stats.totalScans > 0 ? Math.round((stats.threatsDetected / stats.totalScans) * 100) : 0}%
              </motion.span>
            </div>
            <motion.div 
              className="text-3xl font-bold text-gray-800 mb-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
            >
              {stats.threatsDetected}
            </motion.div>
            <div className="text-sm text-gray-600">Threats Detected</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <motion.div 
                className="bg-green-100 p-3 rounded-xl"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <CheckCircle className="h-6 w-6 text-green-600" />
              </motion.div>
              <motion.span 
                className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-semibold"
                whileHover={{ scale: 1.1 }}
              >
                {stats.totalScans > 0 ? Math.round((stats.safeContent / stats.totalScans) * 100) : 0}%
              </motion.span>
            </div>
            <motion.div 
              className="text-3xl font-bold text-gray-800 mb-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              {stats.safeContent}
            </motion.div>
            <div className="text-sm text-gray-600">Safe Content</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-2xl transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <motion.div 
                className="bg-purple-100 p-3 rounded-xl"
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
              >
                <Clock className="h-6 w-6 text-purple-600" />
              </motion.div>
              <Zap className="h-5 w-5 text-yellow-500" />
            </div>
            <motion.div 
              className="text-3xl font-bold text-gray-800 mb-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
            >
              {stats.todayScans}
            </motion.div>
            <div className="text-sm text-gray-600">Today's Scans</div>
          </motion.div>
        </div>

        {/* Quick Actions and Recent Scans Section */}
        <div className="grid lg:grid-cols-3 gap-8 mt-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Zap className="h-6 w-6 mr-2 text-yellow-500" />
                Quick Actions
              </h2>
              <div className="space-y-4">
                {quickActions.map((action, index) => (
                  <Link key={index} to={action.link}>
                    <motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="group flex items-center p-4 rounded-xl bg-gradient-to-br hover:shadow-lg transition-all cursor-pointer border border-gray-100 hover:border-transparent"
                      style={{
                        background: 'linear-gradient(to bottom right, white, white)',
                      }}
                      whileHover={{
                        scale: 1.02,
                        background: 'linear-gradient(to bottom right, rgba(59, 130, 246, 0.1), rgba(147, 51, 234, 0.1))'
                      }}
                    >
                      <div className={`bg-gradient-to-br ${action.color} p-3 rounded-xl mr-4`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-800">{action.title}</div>
                        <div className="text-sm text-gray-600">{action.description}</div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Recent Scans */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Clock className="h-6 w-6 mr-2 text-blue-500" />
                Recent Scans
                <span className="ml-3 text-sm font-normal text-gray-500">({filteredScans.length})</span>
              </h2>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search scans..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </div>

              {/* Filter Buttons */}
              <div className="flex flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Type:</span>
                  <button
                    onClick={() => setFilterType('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterType === 'all'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterType('email')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterType === 'email'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Email
                  </button>
                  <button
                    onClick={() => setFilterType('sms')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterType === 'sms'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    SMS
                  </button>
                  <button
                    onClick={() => setFilterType('url')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterType === 'url'
                        ? 'bg-orange-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    URL
                  </button>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <span className="text-sm font-medium text-gray-700">Status:</span>
                  <button
                    onClick={() => setFilterResult('all')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterResult === 'all'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterResult('safe')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterResult === 'safe'
                        ? 'bg-green-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Safe
                  </button>
                  <button
                    onClick={() => setFilterResult('phishing')}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      filterResult === 'phishing'
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Phishing
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {filteredScans.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No scans found matching your filters</p>
                </div>
              ) : (
                filteredScans.map((scan, index) => {
                const Icon = getTypeIcon(scan.type);
                const isPhishing = scan.result === 'phishing';
                const isDeleting = deletingId === scan.id;
                const isDownloading = downloadingId === scan.id;
                
                return (
                  <motion.div
                    key={scan.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ 
                      opacity: isDeleting ? 0 : 1, 
                      y: 0,
                      x: isDeleting ? -100 : 0,
                      scale: isDeleting ? 0.8 : 1
                    }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="flex items-center p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all border border-gray-200"
                  >
                    <div className={`p-3 rounded-xl mr-4 ${
                      scan.type === 'email' ? 'bg-blue-100' :
                      scan.type === 'sms' ? 'bg-purple-100' :
                      'bg-orange-100'
                    }`}>
                      <Icon className={`h-5 w-5 ${
                        scan.type === 'email' ? 'text-blue-600' :
                        scan.type === 'sms' ? 'text-purple-600' :
                        'text-orange-600'
                      }`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-800 truncate">{scan.content}</div>
                      <div className="text-sm text-gray-500">{scan.time}</div>
                    </div>
                    
                    <div className="flex items-center space-x-3 ml-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isPhishing 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {isPhishing ? 'Phishing' : 'Safe'}
                      </div>
                      <div className={`text-sm font-bold ${
                        scan.risk > 70 ? 'text-red-600' :
                        scan.risk > 40 ? 'text-orange-600' :
                        'text-green-600'
                      }`}>
                        {scan.risk}%
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDownloadPDF(scan)}
                        disabled={isDownloading}
                        className={`p-2 rounded-lg transition-colors ${
                          isDownloading 
                            ? 'bg-blue-100 cursor-wait' 
                            : 'hover:bg-blue-100'
                        }`}
                        title="Download PDF Report"
                      >
                        <motion.div
                          animate={isDownloading ? { rotate: 360 } : { rotate: 0 }}
                          transition={{ duration: 1, repeat: isDownloading ? Infinity : 0, ease: "linear" }}
                        >
                          <Download className="h-4 w-4 text-blue-600" />
                        </motion.div>
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setDeleteModal({ isOpen: true, scanId: scan.id })}
                        disabled={isDeleting}
                        className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                        title="Delete Scan"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </motion.button>
                    </div>
                  </motion.div>
                );
              }))}
            </div>

            {/* View All Link */}
            <div className="mt-6 text-center">
              <Link to="/profile" className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center">
                View All Scans
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </motion.div>
        </div>
        </>
        )}

        {/* Not Logged In State */}
        {!loading && !currentUser && (
          <div className="text-center py-20">
            <Shield className="h-20 w-20 text-gray-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Welcome to PhishGuard</h2>
            <p className="text-gray-600 mb-8">Please log in to view your dashboard and start scanning</p>
            <Link 
              to="/login"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
            >
              Login to Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        )}

        {/* Visual Analytics Section - Moved to bottom */}
        {currentUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-8 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 rounded-2xl shadow-xl p-8 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent flex items-center">
                <PieChart className="h-8 w-8 mr-3 text-blue-600" />
                Visual Analytics
              </h2>
              <div className="text-sm text-gray-600 bg-white px-4 py-2 rounded-full shadow-sm">
                Last 30 days
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Type Distribution */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full mr-3"></div>
                  Scan Types Distribution
                </h3>
                <div className="space-y-5">
                  {['email', 'sms', 'url'].map((type, index) => {
                    const count = recentScans.filter(s => s.type === type).length;
                    const percentage = stats.totalScans > 0 ? (count / stats.totalScans) * 100 : 0;
                    const colors = {
                      email: { bg: 'bg-blue-500', gradient: 'from-blue-400 to-blue-600', icon: Mail },
                      sms: { bg: 'bg-purple-500', gradient: 'from-purple-400 to-purple-600', icon: MessageSquare },
                      url: { bg: 'bg-orange-500', gradient: 'from-orange-400 to-orange-600', icon: Globe }
                    };
                    const Icon = colors[type].icon;
                    
                    return (
                      <motion.div
                        key={type}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + index * 0.1 }}
                        className="group"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${colors[type].gradient} mr-3`}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-base font-semibold text-gray-800 capitalize">{type}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                            {count} <span className="text-gray-500">({percentage.toFixed(0)}%)</span>
                          </span>
                        </div>
                        <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1.2, delay: 1 + index * 0.1, ease: "easeOut" }}
                            className={`h-full bg-gradient-to-r ${colors[type].gradient} rounded-full relative`}
                          >
                            <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                          </motion.div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Threat Analysis */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.9 }}
                className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
                  <div className="w-2 h-8 bg-gradient-to-b from-red-500 to-green-500 rounded-full mr-3"></div>
                  Security Analysis
                </h3>
                <div className="space-y-5">
                  {[
                    { label: 'Phishing Detected', count: stats.threatsDetected, color: 'from-red-400 to-red-600', icon: AlertTriangle },
                    { label: 'Safe Content', count: stats.safeContent, color: 'from-green-400 to-green-600', icon: Shield }
                  ].map((item, index) => {
                    const percentage = stats.totalScans > 0 ? (item.count / stats.totalScans) * 100 : 0;
                    const Icon = item.icon;
                    
                    return (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 1 + index * 0.15 }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${item.color} mr-3`}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-base font-semibold text-gray-800">{item.label}</span>
                          </div>
                          <span className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                            {item.count} <span className="text-gray-500">({percentage.toFixed(0)}%)</span>
                          </span>
                        </div>
                        <div className="relative w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 1.2, delay: 1 + index * 0.15, ease: "easeOut" }}
                            className={`h-full bg-gradient-to-r ${item.color} rounded-full relative`}
                          >
                            <div className="absolute inset-0 bg-white opacity-20 animate-pulse"></div>
                          </motion.div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Risk Distribution Cards */}
                <div className="mt-8">
                  <h4 className="text-base font-bold text-gray-700 mb-4 flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-gray-600" />
                    Risk Levels
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: 'Low', range: [0, 40], gradient: 'from-green-400 to-green-600', bg: 'bg-green-50', border: 'border-green-200' },
                      { label: 'Medium', range: [41, 70], gradient: 'from-orange-400 to-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
                      { label: 'High', range: [71, 100], gradient: 'from-red-400 to-red-600', bg: 'bg-red-50', border: 'border-red-200' }
                    ].map((risk, index) => {
                      const count = recentScans.filter(s => s.risk >= risk.range[0] && s.risk <= risk.range[1]).length;
                      return (
                        <motion.div
                          key={risk.label}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 1.2 + index * 0.1 }}
                          whileHover={{ scale: 1.05, y: -2 }}
                          className={`${risk.bg} border-2 ${risk.border} rounded-xl p-4 text-center hover:shadow-lg transition-all cursor-pointer`}
                        >
                          <div className={`text-3xl font-black bg-gradient-to-r ${risk.gradient} bg-clip-text text-transparent mb-1`}>
                            {count}
                          </div>
                          <div className="text-xs font-semibold text-gray-600">{risk.label} Risk</div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </div>
      
      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, scanId: null })}
        onConfirm={handleDeleteScan}
        title="Delete Scan?"
        message="Are you sure you want to delete this scan? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default Dashboard;
