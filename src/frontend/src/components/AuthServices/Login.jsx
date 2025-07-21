import React, { useState } from 'react'
import AuthService from '../../services/AuthService'
import './Auth.scss'

const Login = ({ isOpen, onClose, onSwitchToSignUp, onSwitchToForgotPassword, onAuthSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors([])
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors([])

    // Validate form
    const validationErrors = AuthService.validateLoginData(formData)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setLoading(false)
      return
    }

    try {
      await AuthService.login(formData)

      // Reset form
      setFormData({ username: '', password: '' })

      // Call success callback instead of reload
      if (onAuthSuccess) {
        onAuthSuccess()
      }

      // Small delay to ensure state updates, then reload
      setTimeout(() => {
        window.location.reload()
      }, 100)

    } catch (error) {
      setErrors([error.message])
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setFormData({ username: '', password: '' })
    setErrors([])
    onClose()
  }

  const handleOverlayClick = (e) => {
    if (e.target.className === 'auth-modal-overlay') {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="auth-modal-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal">
        <div className="auth-header">
          <h2>Đăng nhập</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label>Tên đăng nhập</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          {errors.length > 0 && (
            <div className="error-messages">
              {errors.map((error, index) => (
                <p key={index} className="error-message">{error}</p>
              ))}
            </div>
          )}

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng nhập'}
          </button>

          {/* Forgot Password Link */}
          <div className="forgot-password-link">
            <button
              type="button"
              className="forgot-btn"
              onClick={onSwitchToForgotPassword}
            >
              Quên mật khẩu?
            </button>
          </div>
        </form>

        <div className="auth-switch">
          <p>
            Chưa có tài khoản?{' '}
            <button className="switch-btn" onClick={onSwitchToSignUp}>
              Đăng ký ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login