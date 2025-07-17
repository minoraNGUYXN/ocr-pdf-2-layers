import React, { useState, useRef, useEffect } from 'react'
import AuthService from '../../services/AuthService'
import './User.scss'

const User = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [formData, setFormData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    newEmail: ''
  })
  const [errors, setErrors] = useState([])
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const dropdownRef = useRef(null)

  const user = AuthService.getUser()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Clear success message after 3 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors([])
    setSuccessMessage('')
  }

  const handleLogout = () => {
    // Close dropdown first
    setIsDropdownOpen(false)

    // Clear any modals
    setShowChangePassword(false)
    setShowChangeEmail(false)

    // Clear form data
    setFormData({
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      newEmail: ''
    })
    setErrors([])
    setSuccessMessage('')

    // Logout and redirect
    AuthService.logout()
    window.location.href = '/'
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors([])
    setSuccessMessage('')

    // Client-side validation
    const validationErrors = AuthService.validateChangePasswordData({
      oldPassword: formData.oldPassword,
      newPassword: formData.newPassword,
      confirmPassword: formData.confirmPassword
    })

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setLoading(false)
      return
    }

    try {
      const response = await AuthService.changePassword(
        formData.oldPassword,
        formData.newPassword
      )

      setSuccessMessage(response.message || 'Đổi mật khẩu thành công!')
      setShowChangePassword(false)
      setFormData(prev => ({
        ...prev,
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
    } catch (error) {
      setErrors([error.message])
    } finally {
      setLoading(false)
    }
  }

  const handleChangeEmail = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors([])
    setSuccessMessage('')

    // Client-side validation
    const validationErrors = AuthService.validateChangeEmailData({
      newEmail: formData.newEmail
    })

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      setLoading(false)
      return
    }

    try {
      const response = await AuthService.changeEmail(formData.newEmail)

      setSuccessMessage(response.message || 'Đổi email thành công!')
      setShowChangeEmail(false)
      setFormData(prev => ({ ...prev, newEmail: '' }))

      // Force re-render to show new email
      window.location.reload()
    } catch (error) {
      setErrors([error.message])
    } finally {
      setLoading(false)
    }
  }

  const resetForms = () => {
    setShowChangePassword(false)
    setShowChangeEmail(false)
    setFormData({
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
      newEmail: ''
    })
    setErrors([])
    setSuccessMessage('')
  }

  return (
    <div className="user-menu" ref={dropdownRef}>
      {/* Success message */}
      {successMessage && (
        <div className="success-notification">
          {successMessage}
        </div>
      )}

      <div
        className="user-avatar"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className="avatar-circle">
          {user?.username?.charAt(0).toUpperCase() || 'U'}
        </div>
      </div>

      {isDropdownOpen && (
        <div className="user-dropdown">
          <div className="user-info">
            <div className="user-name">{user?.username}</div>
            <div className="user-email">{user?.email}</div>
          </div>

          <div className="dropdown-divider"></div>

          <div className="dropdown-menu">
            <button
              className="dropdown-item"
              onClick={() => {
                setShowChangePassword(true)
                setIsDropdownOpen(false)
              }}
            >
              Đổi mật khẩu
            </button>
            <button
              className="dropdown-item"
              onClick={() => {
                setShowChangeEmail(true)
                setIsDropdownOpen(false)
              }}
            >
              Đổi email
            </button>
            <button
              className="dropdown-item logout"
              onClick={handleLogout}
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && resetForms()}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Đổi mật khẩu</h3>
              <button className="close-btn" onClick={resetForms}>×</button>
            </div>

            <form onSubmit={handleChangePassword}>
              <div className="form-group">
                <label>Mật khẩu hiện tại</label>
                <input
                  type="password"
                  name="oldPassword"
                  value={formData.oldPassword}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Mật khẩu mới</label>
                <input
                  type="password"
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                />
              </div>

              {errors.length > 0 && (
                <div className="error-messages">
                  {errors.map((error, index) => (
                    <p key={index} className="error-message">{error}</p>
                  ))}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForms}
                  disabled={loading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Email Modal */}
      {showChangeEmail && (
        <div className="modal-overlay" onClick={(e) => e.target.className === 'modal-overlay' && resetForms()}>
          <div className="modal-content">
            <div className="modal-header">
              <h3>Đổi email</h3>
              <button className="close-btn" onClick={resetForms}>×</button>
            </div>

            <form onSubmit={handleChangeEmail}>
              <div className="form-group">
                <label>Email hiện tại</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="disabled-input"
                />
              </div>

              <div className="form-group">
                <label>Email mới</label>
                <input
                  type="email"
                  name="newEmail"
                  value={formData.newEmail}
                  onChange={handleInputChange}
                  required
                  disabled={loading}
                  placeholder="Nhập email mới"
                />
              </div>

              {errors.length > 0 && (
                <div className="error-messages">
                  {errors.map((error, index) => (
                    <p key={index} className="error-message">{error}</p>
                  ))}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForms}
                  disabled={loading}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Đang xử lý...' : 'Đổi email'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default User