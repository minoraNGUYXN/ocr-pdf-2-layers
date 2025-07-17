import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header/Header'
import Upload from './pages/Upload/Upload'
import History from './pages/History/History'
import Login from './components/AuthServices/Login'
import SignUp from './components/AuthServices/SignUp'
import AuthService from './services/AuthService'
import './App.css'

function App() {
  const [authModal, setAuthModal] = useState({ login: false, signup: false })
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication status on mount
  useEffect(() => {
    setIsAuthenticated(AuthService.isAuthenticated())
  }, [])

  const openModal = (type) => {
    // Only open modal if not authenticated
    if (!isAuthenticated) {
      setAuthModal({ login: type === 'login', signup: type === 'signup' })
    }
  }

  const closeModal = () => {
    setAuthModal({ login: false, signup: false })
  }

  const handleAuthSuccess = () => {
    setIsAuthenticated(true)
    closeModal()
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    closeModal()
  }

  return (
    <Router>
      <div className="App">
        <Header
          onOpenLogin={() => openModal('login')}
          onOpenSignUp={() => openModal('signup')}
        />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Upload />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>

        {/* Only show modals if user is not authenticated */}
        {!isAuthenticated && (
          <>
            <Login
              isOpen={authModal.login}
              onClose={closeModal}
              onSwitchToSignUp={() => openModal('signup')}
              onAuthSuccess={handleAuthSuccess}
            />

            <SignUp
              isOpen={authModal.signup}
              onClose={closeModal}
              onSwitchToLogin={() => openModal('login')}
              onAuthSuccess={handleAuthSuccess}
            />
          </>
        )}
      </div>
    </Router>
  )
}

export default App