import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import EmailAnalysis from './pages/EmailAnalysis'
import SMSAnalysis from './pages/SMSAnalysis'
import URLAnalysis from './pages/URLAnalysis'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Profile from './pages/Profile'
import ResetPassword from './pages/ResetPassword'
import EmailMonitoring from './pages/EmailMonitoring'

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ScrollToTop />
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/email-analysis" 
                element={
                  <PrivateRoute>
                    <EmailAnalysis />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/sms-analysis" 
                element={
                  <PrivateRoute>
                    <SMSAnalysis />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/url-analysis" 
                element={
                  <PrivateRoute>
                    <URLAnalysis />
                  </PrivateRoute>
                } 
              />
              <Route 
                path="/email-monitoring" 
                element={
                  <PrivateRoute>
                    <EmailMonitoring />
                  </PrivateRoute>
                } 
              />
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </Router>
  )
}

export default App
