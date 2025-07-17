import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import AuthService from '../../services/AuthService'
import User from '../User/User'
import './Header.scss'

const Header = ({ onOpenLogin, onOpenSignUp }) => {
  const location = useLocation()
  const isAuthenticated = AuthService.isAuthenticated()

  return (
    <header className="header">
      <div className="container">
        <div className="left-section">
          <Link to="/" className="logo">
            OCR Processor
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

        <div className="auth-section">
          {isAuthenticated ? (
            <User />
          ) : (
            <div className="auth-buttons">
              <button className="login-btn" onClick={onOpenLogin}>
                Login
              </button>
              <button className="signup-btn" onClick={onOpenSignUp}>
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header