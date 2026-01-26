import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Shield, Mail, MessageSquare, Link as LinkIcon, 
  TrendingUp, AlertTriangle, CheckCircle, BarChart3,
  Clock, Zap, ArrowRight, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserStats, getRecentScans } from '../services/scanService';

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalScans: 0,
    threatsDetected: 0,
    safeContent: 0,
    todayScans: 0
  });
  const [recentScans, setRecentScans] = useState([]);
  const [loading, setLoading] = useState(true);

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
            time: formatTimestamp(scan.createdAt || scan.timestamp)
          };
        });
        setRecentScans(formattedScans);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [currentUser]);

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
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 p-3 rounded-xl">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">{stats.totalScans}</div>
            <div className="text-sm text-gray-600">Total Scans</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-red-100 p-3 rounded-xl">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-semibold">
                {Math.round((stats.threatsDetected / stats.totalScans) * 100)}%
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">{stats.threatsDetected}</div>
            <div className="text-sm text-gray-600">Threats Detected</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 p-3 rounded-xl">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full font-semibold">
                {Math.round((stats.safeContent / stats.totalScans) * 100)}%
              </span>
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">{stats.safeContent}</div>
            <div className="text-sm text-gray-600">Safe Content</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 p-3 rounded-xl">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <Zap className="h-5 w-5 text-yellow-500" />
            </div>
            <div className="text-3xl font-bold text-gray-800 mb-1">{stats.todayScans}</div>
            <div className="text-sm text-gray-600">Today's Scans</div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
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
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
              <Clock className="h-6 w-6 mr-2 text-blue-500" />
              Recent Scans
            </h2>
            <div className="space-y-4">
              {recentScans.map((scan, index) => {
                const Icon = getTypeIcon(scan.type);
                const isPhishing = scan.result === 'phishing';
                
                return (
                  <motion.div
                    key={scan.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
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
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* View All Link */}
            <div className="mt-6 text-center">
              <button className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center">
                View All Scans
                <ArrowRight className="ml-2 h-4 w-4" />
              </button>
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
      </div>
    </div>
  );
};

export default Dashboard;
