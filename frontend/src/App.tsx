import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import HomePage from './pages/HomePage'
import VerificationFlow from './pages/VerificationFlow'
import ResultsPage from './pages/ResultsPage'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/verify/:sessionId" element={<VerificationFlow />} />
            <Route path="/results/:sessionId" element={<ResultsPage />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  )
}

export default App

