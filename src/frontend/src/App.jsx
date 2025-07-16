import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Header from './components/Header/Header'
import Upload from './pages/Upload/Upload'
import History from './pages/History/History'
import Login from './components/AuthServices/Login'
import SignUp from './components/AuthServices/SignUp'
import './App.css'

function App() {
  const [showLogin, setShowLogin] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)

  const handleOpenLogin = () => {
    setShowLogin(true)
    setShowSignUp(false)
  }

  const handleOpenSignUp = () => {
    setShowSignUp(true)
    setShowLogin(false)
  }

  const handleCloseModals = () => {
    setShowLogin(false)
    setShowSignUp(false)
  }

  return (
    <Router>
      <div className="App">
        <Header
          onOpenLogin={handleOpenLogin}
          onOpenSignUp={handleOpenSignUp}
        />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Upload />} />
            <Route path="/history" element={<History />} />
          </Routes>
        </main>

        {/* Auth Modals */}
        <Login
          isOpen={showLogin}
          onClose={handleCloseModals}
          onSwitchToSignUp={handleOpenSignUp}
        />

        <SignUp
          isOpen={showSignUp}
          onClose={handleCloseModals}
          onSwitchToLogin={handleOpenLogin}
        />
      </div>
    </Router>
  )
}

export default App