import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Trim and normalize email
    const normalizedEmail = formData.email.trim().toLowerCase();

    // Comprehensive email validation
    // 1. Check for @ symbol
    if (!normalizedEmail.includes('@')) {
      return setError('Email must contain @ symbol');
    }

    // 2. Check for exactly one @ symbol
    const atCount = (normalizedEmail.match(/@/g) || []).length;
    if (atCount !== 1) {
      return setError('Email must contain exactly one @ symbol');
    }

    // 3. Basic format validation with strict regex
    const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(normalizedEmail)) {
      return setError('Invalid email format. Please use a valid email address');
    }

    // 4. Split and validate email parts
    const emailParts = normalizedEmail.split('@');
    if (emailParts.length !== 2) {
      return setError('Invalid email format');
    }

    const [localPart, domainPart] = emailParts;
    
    // 5. Validate local part (username before @)
    if (!localPart || localPart.length < 2) {
      return setError('Email username must be at least 2 characters');
    }

    if (localPart.length > 64) {
      return setError('Email username is too long');
    }

    // Check for invalid consecutive dots
    if (localPart.includes('..')) {
      return setError('Email cannot contain consecutive dots');
    }

    // Check if starts or ends with dot
    if (localPart.startsWith('.') || localPart.endsWith('.')) {
      return setError('Email username cannot start or end with a dot');
    }

    // 6. Validate domain part
    if (!domainPart || domainPart.length < 4) {
      return setError('Invalid email domain - domain is too short');
    }

    // Check for invalid consecutive dots in domain
    if (domainPart.includes('..')) {
      return setError('Invalid email domain format');
    }

    // Check if domain starts or ends with dot or hyphen
    if (domainPart.startsWith('.') || domainPart.endsWith('.') || 
        domainPart.startsWith('-') || domainPart.endsWith('-')) {
      return setError('Invalid email domain format');
    }

    // 7. Split domain into parts
    const domainParts = domainPart.split('.');
    if (domainParts.length < 2) {
      return setError('Email must have a valid domain (e.g., gmail.com)');
    }

    // 8. Validate domain name (before TLD)
    const domainName = domainParts.slice(0, -1).join('.');
    if (domainName.length < 2) {
      return setError('Email domain name must be at least 2 characters');
    }

    // 9. Validate TLD (top-level domain)
    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) {
      return setError('Invalid email domain extension');
    }

    // Check if TLD contains only letters
    if (!/^[a-zA-Z]+$/.test(tld)) {
      return setError('Invalid email domain extension');
    }

    // 10. List of verified email providers and common domains
    const validProviders = [
      // Major email providers
      'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.co.in', 'yahoo.co.uk',
      'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
      'icloud.com', 'me.com', 'mac.com',
      'aol.com', 'protonmail.com', 'proton.me',
      'zoho.com', 'zohomail.com', 'mail.com',
      'yandex.com', 'yandex.ru', 'gmx.com', 'gmx.net',
      'fastmail.com', 'tutanota.com', 'tutanota.de',
      'mail.ru', 'inbox.ru', 'list.ru',
      'rediffmail.com', 'rediff.com',
      // Educational domains
      'edu', 'ac.in', 'ac.uk', 'edu.in',
      // Company domains (common patterns)
      'company.com', 'corp.com', 'office.com'
    ];

    // Check if domain ends with a known valid provider or has valid structure
    const isKnownProvider = validProviders.some(provider => 
      domainPart === provider || domainPart.endsWith('.' + provider)
    );

    // Check for educational domains
    const isEduDomain = domainPart.includes('.edu') || domainPart.includes('.ac.');

    // Validate domain structure for non-listed providers
    const hasValidStructure = domainParts.every(part => 
      part.length >= 2 && /^[a-zA-Z0-9-]+$/.test(part)
    );

    // Additional check: domain should look legitimate
    const commonTLDs = ['com', 'net', 'org', 'edu', 'gov', 'mil', 'co', 'in', 'uk', 'us', 'ca', 'au', 'de', 'fr', 'jp', 'cn', 'ru', 'br', 'it', 'nl', 'se', 'no', 'es', 'pl'];
    const hasValidTLD = commonTLDs.includes(tld);

    if (!isKnownProvider && !isEduDomain && !hasValidTLD) {
      return setError('Please use a valid email provider (e.g., Gmail, Yahoo, Outlook, or your organization email)');
    }

    if (!isKnownProvider && !isEduDomain && !hasValidStructure) {
      return setError('Invalid email domain format. Please use a legitimate email address');
    }

    // 11. Validate display name
    if (!formData.displayName || formData.displayName.trim().length < 2) {
      return setError('Display name must be at least 2 characters');
    }

    // 12. Check password match
    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    // 13. Enhanced password validation
    if (formData.password.length < 8) {
      return setError('Password must be at least 8 characters');
    }

    const hasUppercase = /[A-Z]/.test(formData.password);
    const hasLowercase = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password);

    if (!hasUppercase) {
      return setError('Password must contain at least one uppercase letter');
    }

    if (!hasLowercase) {
      return setError('Password must contain at least one lowercase letter');
    }

    if (!hasNumber) {
      return setError('Password must contain at least one number');
    }

    if (!hasSpecialChar) {
      return setError('Password must contain at least one special character (!@#$%^&*...)');
    }

    setLoading(true);

    try {
      await signup(normalizedEmail, formData.password, formData.displayName);
      navigate('/dashboard');
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Email already in use');
      } else if (err.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak');
      } else {
        setError('Failed to create account');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      console.error('Google Sign-In Error:', err);
      const errorMessage = err.message || 'Failed to sign in with Google.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <Shield className="h-12 w-12 text-blue-600" />
            <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              PhishGuard
            </span>
          </Link>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-gray-600">
            Start protecting yourself from phishing attacks
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center"
            >
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="displayName"
                  name="displayName"
                  type="text"
                  required
                  value={formData.displayName}
                  onChange={handleChange}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must be 8+ characters with uppercase, lowercase, number & special character
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-4 w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-700">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
