import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import EmailAnalysis from './pages/EmailAnalysis'
import SMSAnalysis from './pages/SMSAnalysis'
import URLAnalysis from './pages/URLAnalysis'
import Dashboard from './pages/Dashboard'

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
      <ScrollToTop />
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/email-analysis" element={<EmailAnalysis />} />
            <Route path="/sms-analysis" element={<SMSAnalysis />} />
            <Route path="/url-analysis" element={<URLAnalysis />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  )
}

export default App
