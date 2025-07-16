import React, { useState } from 'react'
import AuthService from '../../services/AuthService'
import './Auth.scss'

const SignUp = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await AuthService.signUp(formData)
      onClose()
      window.location.reload() // Refresh to update auth state
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFormData({
      username: '',
      email: '',
      password: ''
    })
    setError(null)
  }

  const handleSwitchToLogin = () => {
    handleReset()
    onSwitchToLogin()
  }

  if (!isOpen) return null

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-header">
          <h2>Sign Up</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Choose a username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              placeholder="Choose a password"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleReset}
              disabled={loading}
            >
              Reset
            </button>
          </div>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <span className="link" onClick={handleSwitchToLogin}>Sign in here</span></p>
        </div>
      </div>
    </div>
  )
}

export default SignUp