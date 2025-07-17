import React, { useState } from 'react'
import AuthService from '../../services/AuthService'
import './Auth.scss'

const SignUp = ({ isOpen, onClose, onSwitchToLogin, onAuthSuccess }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setErrors(['Mật khẩu xác nhận không khớp'])
      setLoading(false)
      return
    }

    // Validate form
    const validationErrors = AuthService.validateSignUpData(formData)
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setLoading(false)
      return
    }

    try {
      // Sign up user
      await AuthService.signUp({
        username: formData.username,
        email: formData.email,
        password: formData.password
      })

      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        confirmPassword: ''
      })

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
    setFormData({
      username: '',
      email: '',
      password: '',
      confirmPassword: ''
    })
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
          <h2>Đăng ký</h2>
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
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
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

          <div className="form-group">
            <label>Xác nhận mật khẩu</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
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
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </button>
        </form>

        <div className="auth-switch">
          <p>
            Đã có tài khoản?{' '}
            <button className="switch-btn" onClick={onSwitchToLogin}>
              Đăng nhập ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default SignUp