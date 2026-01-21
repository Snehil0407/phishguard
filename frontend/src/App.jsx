import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './App.css'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import EmailAnalysis from './pages/EmailAnalysis'
import SMSAnalysis from './pages/SMSAnalysis'
import URLAnalysis from './pages/URLAnalysis'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/email-analysis" element={<EmailAnalysis />} />
          <Route path="/sms-analysis" element={<SMSAnalysis />} />
          <Route path="/url-analysis" element={<URLAnalysis />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  )
}

export default App
