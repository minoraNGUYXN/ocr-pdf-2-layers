import React, { useState } from 'react'
import AuthService from '../../services/AuthService'
import './Auth.scss'

const Login = ({ isOpen, onClose, onSwitchToSignUp }) => {
  const [formData, setFormData] = useState({
    username: '',
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
      await AuthService.login(formData)
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
      password: ''
    })
    setError(null)
  }

  const handleSwitchToSignUp = () => {
    handleReset()
    onSwitchToSignUp()
  }

  if (!isOpen) return null

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-header">
          <h2>Login</h2>
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
              placeholder="Enter your username"
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
              placeholder="Enter your password"
            />
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
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
          <p>Don't have an account? <span className="link" onClick={handleSwitchToSignUp}>Sign up here</span></p>
        </div>
      </div>
    </div>
  )
}

export default Login