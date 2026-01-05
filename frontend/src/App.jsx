import { useState } from 'react'
import './App.css'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">🛡️</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800">PhishGuard</h1>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#" className="text-gray-600 hover:text-indigo-600">Home</a>
              <a href="#" className="text-gray-600 hover:text-indigo-600">Analyze</a>
              <a href="#" className="text-gray-600 hover:text-indigo-600">Learn</a>
              <a href="#" className="text-gray-600 hover:text-indigo-600">About</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-800 mb-4">
            AI-Powered Phishing Detection
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Protect yourself from phishing attacks with our intelligent detection system.
            Analyze emails, SMS, and URLs in real-time.
          </p>
          <div className="flex justify-center space-x-4">
            <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition">
              Get Started
            </button>
            <button className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition">
              Learn More
            </button>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
            <div className="text-4xl mb-4">📧</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Email Analysis</h3>
            <p className="text-gray-600">
              Detect phishing attempts in email content with advanced NLP and machine learning.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
            <div className="text-4xl mb-4">📱</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">SMS Detection</h3>
            <p className="text-gray-600">
              Identify malicious SMS messages and smishing attempts instantly.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
            <div className="text-4xl mb-4">🔗</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">URL Scanning</h3>
            <p className="text-gray-600">
              Real-time URL analysis through our browser extension for safe browsing.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">99%</div>
              <p className="text-gray-600">Detection Accuracy</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">&lt;2s</div>
              <p className="text-gray-600">Response Time</p>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">100%</div>
              <p className="text-gray-600">Explainable Results</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2026 PhishGuard - MCA 6th Trimester Project</p>
          <p className="mt-2">Powered by AI & Machine Learning</p>
        </div>
      </footer>
    </div>
  )
}

export default App
