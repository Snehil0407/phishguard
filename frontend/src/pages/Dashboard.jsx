import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  Shield, Mail, MessageSquare, Link as LinkIcon, 
  TrendingUp, AlertTriangle, CheckCircle, BarChart3,
  Clock, Zap, ArrowRight
} from 'lucide-react';

const Dashboard = () => {
  // Mock data - In Phase 5, this will come from Firebase
  const stats = {
    totalScans: 156,
    threatsDetected: 23,
    safeContent: 133,
    todayScans: 12
  };

  const recentScans = [
    {
      id: 1,
      type: 'email',
      content: 'Urgent: Verify your account...',
      result: 'phishing',
      risk: 95,
      time: '5 mins ago'
    },
    {
      id: 2,
      type: 'sms',
      content: 'Hey! Meeting reminder for tomorrow...',
      result: 'safe',
      risk: 8,
      time: '1 hour ago'
    },
    {
      id: 3,
      type: 'url',
      content: 'http://secure-bank-verify.com',
      result: 'phishing',
      risk: 99,
      time: '2 hours ago'
    },
    {
      id: 4,
      type: 'email',
      content: 'Newsletter: Weekly tech updates',
      result: 'safe',
      risk: 12,
      time: '3 hours ago'
    }
  ];

  const quickActions = [
    {
      title: 'Email Analysis',
      description: 'Check emails for phishing',
      icon: Mail,
      color: 'from-blue-500 to-cyan-500',
      link: '/analyze/email'
    },
    {
      title: 'SMS Analysis',
      description: 'Scan text messages',
      icon: MessageSquare,
      color: 'from-purple-500 to-pink-500',
      link: '/analyze/sms'
    },
    {
      title: 'URL Analysis',
      description: 'Verify website safety',
      icon: LinkIcon,
      color: 'from-orange-500 to-red-500',
      link: '/analyze/url'
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

        {/* Performance Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-2xl shadow-2xl p-8 text-white"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">System Performance</h2>
              <p className="text-white/90">Your security is powered by advanced AI models</p>
            </div>
            <Shield className="h-16 w-16 text-white/30" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl font-bold mb-2">96.2%</div>
              <div className="text-white/90">Email Detection Accuracy</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl font-bold mb-2">98.1%</div>
              <div className="text-white/90">SMS Detection Accuracy</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6">
              <div className="text-4xl font-bold mb-2">99.8%</div>
              <div className="text-white/90">URL Detection Accuracy</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
