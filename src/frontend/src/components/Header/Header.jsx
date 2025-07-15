
import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Header.scss'

const Header = () => {
  const location = useLocation()

  return (
    <header className="header">
      <div className="container">
        <div className="left-section">
          <Link to="/" className="logo">
          </Link>
          <nav className="nav">
            <Link
              to="/"
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
            >
              Process File
            </Link>
            <Link
              to="/history"
              className={`nav-link ${location.pathname === '/history' ? 'active' : ''}`}
            >
              History
            </Link>
          </nav>
        </div>

        <div className="auth-buttons">
          <button className="login-btn">
            Login
          </button>
          <button className="signup-btn">
            Sign Up
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header