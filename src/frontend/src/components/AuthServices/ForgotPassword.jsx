import React, { useState } from 'react'
import AuthService from '../../services/AuthService'
import './Auth.scss'

const ForgotPassword = ({ isOpen, onClose, onSwitchToLogin }) => {
  const [step, setStep] = useState(1) // 1: nhập username, 2: nhập OTP và mật khẩu mới
  const [formData, setFormData] = useState({
    username: '',
    resetCode: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [userEmail, setUserEmail] = useState('') // Lưu email được trả về từ server
  const [errors, setErrors] = useState([])
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors([])
    setSuccessMessage('')
  }

  const handleSendOTP = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors([])
    setSuccessMessage('')

    // Validate username
    const validationErrors = AuthService.validateForgotPasswordData({ username: formData.username })
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setLoading(false)
      return
    }

    try {
      const response = await AuthService.forgotPassword(formData.username)
      setUserEmail(response.email) // Lưu email được ẩn danh từ server
      setSuccessMessage('Mã khôi phục đã được gửi đến email của bạn!')
      setStep(2) // Chuyển sang bước 2
    } catch (error) {
      setErrors([error.message])
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors([])
    setSuccessMessage('')

    // Validate reset data
    const validationErrors = AuthService.validateResetPasswordData({
      username: formData.username,
      resetCode: formData.resetCode,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword
    })
    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setLoading(false)
      return
    }

    try {
      await AuthService.resetPassword(formData.username, formData.resetCode, formData.newPassword)
      setSuccessMessage('Mật khẩu đã được đặt lại thành công!')

      // Chờ 2 giây rồi chuyển về trang đăng nhập
      setTimeout(() => {
        handleClose()
        onSwitchToLogin()
      }, 2000)
    } catch (error) {
      setErrors([error.message])
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setFormData({
      username: '',
      resetCode: '',
      newPassword: '',
      confirmPassword: ''
    })
    setUserEmail('')
    setErrors([])
    setSuccessMessage('')
    onClose()
  }

  const handleOverlayClick = (e) => {
    if (e.target.className === 'auth-modal-overlay') {
      handleClose()
    }
  }

  const handleBackToStep1 = () => {
    setStep(1)
    setFormData(prev => ({
      ...prev,
      resetCode: '',
      newPassword: '',
      confirmPassword: ''
    }))
    setUserEmail('')
    setErrors([])
    setSuccessMessage('')
  }

  if (!isOpen) return null

  return (
    <div className="auth-modal-overlay" onClick={handleOverlayClick}>
      <div className="auth-modal">
        <div className="auth-header">
          <h2>Quên mật khẩu</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        {step === 1 ? (
          // Bước 1: Nhập username
          <form onSubmit={handleSendOTP} className="auth-form">
            <div className="form-group">
              <label>Tên đăng nhập</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Nhập tên đăng nhập của bạn"
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

            {successMessage && (
              <div className="success-message">
                <strong>{successMessage}</strong>
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
            </button>
          </form>
        ) : (
          // Bước 2: Nhập OTP và mật khẩu mới
          <form onSubmit={handleResetPassword} className="auth-form">
            <div className="otp-info">
              <p>Mã khôi phục đã được gửi đến email: <strong>{userEmail}</strong></p>
              <p>Tài khoản: <strong>{formData.username}</strong></p>
              <button
                type="button"
                className="back-btn"
                onClick={handleBackToStep1}
              >
                ← Thay đổi tài khoản
              </button>
            </div>

            <div className="form-group">
              <label>Mã khôi phục (6 số)</label>
              <input
                type="text"
                name="resetCode"
                value={formData.resetCode}
                onChange={handleInputChange}
                placeholder="Nhập mã 6 số"
                maxLength="6"
                required
              />
            </div>

            <div className="form-group">
              <label>Mật khẩu mới</label>
              <input
                type="password"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                placeholder="Nhập mật khẩu mới"
                required
              />
            </div>

            <div className="form-group">
              <label>Xác nhận mật khẩu mới</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Nhập lại mật khẩu mới"
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

            {successMessage && (
              <div className="success-message">
                <strong>{successMessage}</strong>
              </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )}

        <div className="auth-switch">
          <p>
            Nhớ lại mật khẩu?{' '}
            <button className="switch-btn" onClick={onSwitchToLogin}>
              Đăng nhập ngay
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword