import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, Edit2, Save, X, Shield, Calendar, AlertTriangle, CheckCircle, Download, Trash2, ChevronDown, Filter, Clock, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getUserStats, getRecentScans, deleteScanResult } from '../services/scanService';
import { updateUserProfile } from '../services/userService';
import { generateEmailPDF, generateSMSPDF, generateURLPDF } from '../utils/pdfGenerator';
import ConfirmModal from '../components/ConfirmModal';
import ScanDetailsModal from '../components/ScanDetailsModal';

const Profile = () => {
  const { currentUser, userProfile, fetchUserProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    displayName: '',
    phoneNumber: '',
    email: ''
  });

  const [stats, setStats] = useState({
    totalScans: 0,
    threatsDetected: 0,
    safeContent: 0
  });

  const [scans, setScans] = useState([]);
  const [filteredScans, setFilteredScans] = useState([]);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, scanId: null });
  const [detailsModal, setDetailsModal] = useState({ isOpen: false, scan: null });
  const [downloadingId, setDownloadingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterResult, setFilterResult] = useState('all');
  const [filterTime, setFilterTime] = useState('all');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, [currentUser]);

  // Filter scans based on search and filters
  useEffect(() => {
    let filtered = [...scans];

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
      const isPhishing = filterResult === 'phishing';
      filtered = filtered.filter(scan => scan.isPhishing === isPhishing);
    }

    // Apply time filter
    if (filterTime !== 'all') {
      const now = new Date();
      filtered = filtered.filter(scan => {
        if (!scan.timestamp) return false;
        
        let scanDate;
        if (scan.timestamp?.toDate) {
          scanDate = scan.timestamp.toDate();
        } else if (scan.timestamp instanceof Date) {
          scanDate = scan.timestamp;
        } else if (typeof scan.timestamp === 'string' || typeof scan.timestamp === 'number') {
          scanDate = new Date(scan.timestamp);
        } else {
          return false;
        }
        
        // Validate date
        if (isNaN(scanDate.getTime())) return false;
        
        const diffHours = (now - scanDate) / (1000 * 60 * 60);
        
        switch(filterTime) {
          case 'today':
            return diffHours >= 0 && diffHours <= 24;
          case 'week':
            return diffHours >= 0 && diffHours <= 168; // 7 days
          case 'month':
            return diffHours >= 0 && diffHours <= 720; // 30 days
          default:
            return true;
        }
      });
    }

    setFilteredScans(filtered);
  }, [searchTerm, filterType, filterResult, filterTime, scans]);

  const loadProfileData = async () => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      // Load user stats
      const userStats = await getUserStats(currentUser.uid);
      setStats(userStats);

      // Load all scans
      const allScans = await getRecentScans(currentUser.uid, 50);      setFilteredScans(allScans);      const formattedScans = allScans.map(scan => {
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
          isPhishing: scan.result.isPhishing,
          confidence: Math.round((scan.result.confidence || 0) * 100),
          timestamp: scan.createdAt || scan.timestamp,
          time: formatDate(scan.createdAt || scan.timestamp),
          result: scan.result.isPhishing ? 'phishing' : 'safe',
          risk: Math.round((scan.result.confidence || 0) * 100),
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
      setScans(formattedScans);

      // Set form data
      setFormData({
        displayName: userProfile?.displayName || currentUser.displayName || '',
        phoneNumber: userProfile?.phoneNumber || '',
        email: currentUser.email || ''
      });

      setLoading(false);
    } catch (err) {
      console.error('Error loading profile data:', err);
      setError('Failed to load profile data');
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      displayName: userProfile?.displayName || currentUser.displayName || '',
      phoneNumber: userProfile?.phoneNumber || '',
      email: currentUser.email || ''
    });
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    if (!formData.displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await updateUserProfile(currentUser.uid, {
        displayName: formData.displayName,
        phoneNumber: formData.phoneNumber
      });

      await fetchUserProfile(currentUser.uid);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = async (scan) => {
    setDownloadingId(scan.id);
    
    const userInfo = currentUser ? {
      userName: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
      userEmail: currentUser.email
    } : null;

    try {
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
      await new Promise(resolve => setTimeout(resolve, 300));
      await deleteScanResult(scanId);
      setScans(prev => prev.filter(scan => scan.id !== scanId));
      const userStats = await getUserStats(currentUser.uid);
      setStats(userStats);
    } catch (error) {
      console.error('Error deleting scan:', error);
      alert('Failed to delete scan. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    let date;
    if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else {
      return 'N/A';
    }
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'email': return '📧';
      case 'sms': return '💬';
      case 'url': return '🔗';
      default: return '📄';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <User className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            My Profile
          </h1>
          <p className="text-xl text-gray-600">
            Manage your account and view your security scan history
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Profile Info</h2>
                {!isEditing ? (
                  <button
                    onClick={handleEdit}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Edit2 className="h-5 w-5 text-blue-600" />
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleCancel}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <X className="h-5 w-5 text-gray-600" />
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      <Save className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                  {success}
                </div>
              )}

              <div className="space-y-4">
                {/* Display Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="inline h-4 w-4 mr-2" />
                    Display Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your name"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{formData.displayName || 'Not set'}</p>
                  )}
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="inline h-4 w-4 mr-2" />
                    Email Address
                  </label>
                  <p className="text-gray-900 font-medium">{formData.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="inline h-4 w-4 mr-2" />
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter phone number"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{formData.phoneNumber || 'Not set'}</p>
                  )}
                </div>

                {/* Account Created */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-2" />
                    Member Since
                  </label>
                  <p className="text-gray-900 font-medium">
                    {formatDate(userProfile?.createdAt || currentUser.metadata?.creationTime)}
                  </p>
                </div>
              </div>

              {/* Stats Summary */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Activity Summary</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{stats.totalScans}</div>
                    <div className="text-xs text-gray-600">Total Scans</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{stats.threatsDetected}</div>
                    <div className="text-xs text-gray-600">Threats</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{stats.safeContent}</div>
                    <div className="text-xs text-gray-600">Safe</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Scan History */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <Shield className="h-6 w-6 mr-2 text-blue-600" />
                Scan History ({filteredScans.length})
              </h2>

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

                {/* Filter Dropdowns */}
                <div className="flex flex-wrap gap-3">
                  <Filter className="h-5 w-5 text-gray-500 mt-2" />
                  
                  {/* Type Filter */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowTypeDropdown(!showTypeDropdown);
                        setShowStatusDropdown(false);
                        setShowTimeDropdown(false);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
                    >
                      <span className="text-sm font-medium text-gray-700">Type:</span>
                      <span className="text-sm font-semibold text-blue-600">
                        {filterType === 'all' ? 'All' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>
                    {showTypeDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-xl z-10 min-w-[150px]"
                      >
                        {['all', 'email', 'sms', 'url'].map(type => (
                          <button
                            key={type}
                            onClick={() => {
                              setFilterType(type);
                              setShowTypeDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                              filterType === type ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                            }`}
                          >
                            {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>

                  {/* Status Filter */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowStatusDropdown(!showStatusDropdown);
                        setShowTypeDropdown(false);
                        setShowTimeDropdown(false);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
                    >
                      <span className="text-sm font-medium text-gray-700">Status:</span>
                      <span className={`text-sm font-semibold ${
                        filterResult === 'safe' ? 'text-green-600' : 
                        filterResult === 'phishing' ? 'text-red-600' : 'text-blue-600'
                      }`}>
                        {filterResult === 'all' ? 'All' : filterResult.charAt(0).toUpperCase() + filterResult.slice(1)}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>
                    {showStatusDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-xl z-10 min-w-[150px]"
                      >
                        <button
                          onClick={() => {
                            setFilterResult('all');
                            setShowStatusDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-t-lg transition-colors ${
                            filterResult === 'all' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          All Status
                        </button>
                        <button
                          onClick={() => {
                            setFilterResult('safe');
                            setShowStatusDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                            filterResult === 'safe' ? 'bg-green-50 text-green-600 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          ✅ Safe
                        </button>
                        <button
                          onClick={() => {
                            setFilterResult('phishing');
                            setShowStatusDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-b-lg transition-colors ${
                            filterResult === 'phishing' ? 'bg-red-50 text-red-600 font-semibold' : 'text-gray-700'
                          }`}
                        >
                          ⚠️ Phishing
                        </button>
                      </motion.div>
                    )}
                  </div>

                  {/* Time Filter */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        setShowTimeDropdown(!showTimeDropdown);
                        setShowTypeDropdown(false);
                        setShowStatusDropdown(false);
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-400 transition-all shadow-sm hover:shadow-md"
                    >
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Time:</span>
                      <span className="text-sm font-semibold text-blue-600">
                        {filterTime === 'all' ? 'All Time' : 
                         filterTime === 'today' ? 'Today' :
                         filterTime === 'week' ? 'This Week' : 'This Month'}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </button>
                    {showTimeDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="absolute top-full mt-2 left-0 bg-white border border-gray-200 rounded-lg shadow-xl z-10 min-w-[160px]"
                      >
                        {[{value: 'all', label: 'All Time'}, {value: 'today', label: 'Today'}, {value: 'week', label: 'This Week'}, {value: 'month', label: 'This Month'}].map(time => (
                          <button
                            key={time.value}
                            onClick={() => {
                              setFilterTime(time.value);
                              setShowTimeDropdown(false);
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg transition-colors ${
                              filterTime === time.value ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
                            }`}
                          >
                            {time.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {filteredScans.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">{scans.length === 0 ? 'No scans yet. Start protecting yourself!' : 'No scans found matching your filters'}</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Scrollable Container */}
                  <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scroll-smooth scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                    {filteredScans.map((scan) => {
                    const isDeleting = deletingId === scan.id;
                    const isDownloading = downloadingId === scan.id;
                    
                    return (
                      <motion.div
                        key={scan.id}
                        initial={{ opacity: 1 }}
                        animate={{ 
                          opacity: isDeleting ? 0 : 1,
                          x: isDeleting ? -100 : 0,
                          scale: isDeleting ? 0.8 : 1
                        }}
                        onClick={() => setDetailsModal({ isOpen: true, scan })}
                        className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          <div className="text-2xl">{getTypeIcon(scan.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-800 truncate">{scan.content}</p>
                          <p className="text-xs text-gray-500">{formatDate(scan.timestamp)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        {scan.isPhishing ? (
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                            <div className="text-right">
                              <div className="text-xs font-semibold text-red-600">Phishing</div>
                              <div className="text-xs text-gray-600">{scan.confidence}%</div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <div className="text-right">
                              <div className="text-xs font-semibold text-green-600">Safe</div>
                              <div className="text-xs text-gray-600">{scan.confidence}%</div>
                            </div>
                          </div>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadPDF(scan);
                          }}
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
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModal({ isOpen: true, scanId: scan.id });
                          }}
                          disabled={isDeleting}
                          className="p-2 rounded-lg hover:bg-red-100 transition-colors"
                          title="Delete Scan"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </motion.button>
                      </div>
                    </motion.div>
                    );
                  })}
                </div>
                {/* Scroll Indicator */}
                {scans.length > 5 && (
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"></div>
                )}
              </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Scan Details Modal */}
      <ScanDetailsModal
        isOpen={detailsModal.isOpen}
        onClose={() => setDetailsModal({ isOpen: false, scan: null })}
        scan={detailsModal.scan}
      />
      
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

export default Profile;
