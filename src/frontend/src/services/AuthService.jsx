import axiosInstance from './AxiosConfig'

class AuthService {
  constructor() {
    this._token = localStorage.getItem('access_token')
    this._user = JSON.parse(localStorage.getItem('user') || 'null')
  }

  // Error messages mapping
  _errorMessages = {
    'Username already registered': 'Tên đăng nhập đã tồn tại',
    'Email already registered': 'Email đã được đăng ký',
    'Incorrect username or password': 'Sai tên đăng nhập hoặc mật khẩu',
    'Username already exists': 'Tên đăng nhập đã tồn tại',
    'Email already exists': 'Email đã được đăng ký',
    'Invalid credentials': 'Sai tên đăng nhập hoặc mật khẩu',
    'Current password is incorrect': 'Mật khẩu hiện tại không đúng',
    'Email already in use': 'Email đã được sử dụng',
    'Failed to update password': 'Không thể cập nhật mật khẩu',
    'Failed to update email': 'Không thể cập nhật email'
  }

  _handleError(error) {
    const detail = error.response?.data?.detail || 'Có lỗi xảy ra'
    return this._errorMessages[detail] || detail
  }

  async signUp(userData) {
    try {
      const { data } = await axiosInstance.post('/auth/signup', userData)
      this._setAuth(data.access_token, data.user)
      return data
    } catch (error) {
      throw new Error(this._handleError(error))
    }
  }

  async login(credentials) {
    try {
      const { data } = await axiosInstance.post('/auth/login', credentials)
      this._setAuth(data.access_token, data.user)
      return data
    } catch (error) {
      throw new Error(this._handleError(error))
    }
  }

  // NEW: Change password method
  async changePassword(oldPassword, newPassword) {
    try {
      const { data } = await axiosInstance.post('/auth/change-password', {
        old_password: oldPassword,
        new_password: newPassword
      })
      return data
    } catch (error) {
      throw new Error(this._handleError(error))
    }
  }

  // NEW: Change email method
  async changeEmail(newEmail) {
    try {
      const { data } = await axiosInstance.post('/auth/change-email', {
        new_email: newEmail
      })

      // Update user info in localStorage
      if (this._user) {
        this._user.email = newEmail
        localStorage.setItem('user', JSON.stringify(this._user))
      }

      return data
    } catch (error) {
      throw new Error(this._handleError(error))
    }
  }

  _setAuth(token, user) {
    this._token = token
    this._user = user
    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify(user))
  }

  logout() {
    this._token = null
    this._user = null
    localStorage.clear()
  }

  isAuthenticated() {
    return !!this._token
  }

  getUser() {
    return this._user
  }

  getToken() {
    return this._token
  }

  // Validation helpers
  validateSignUpData({ username, email, password }) {
    const errors = []
    if (!username || username.length < 3) errors.push('Tên đăng nhập ít nhất 3 ký tự')
    if (!email || !email.includes('@')) errors.push('Email không hợp lệ')
    if (!password || password.length < 6) errors.push('Mật khẩu ít nhất 6 ký tự')
    return errors
  }

  validateLoginData({ username, password }) {
    const errors = []
    if (!username || username.length < 3) errors.push('Tên đăng nhập ít nhất 3 ký tự')
    if (!password || password.length < 6) errors.push('Mật khẩu ít nhất 6 ký tự')
    return errors
  }

  // NEW: Validation for change password
  validateChangePasswordData({ oldPassword, newPassword, confirmPassword }) {
    const errors = []
    if (!oldPassword) errors.push('Mật khẩu hiện tại là bắt buộc')
    if (!newPassword || newPassword.length < 6) errors.push('Mật khẩu mới phải có ít nhất 6 ký tự')
    if (newPassword !== confirmPassword) errors.push('Mật khẩu xác nhận không khớp')
    return errors
  }

  // NEW: Validation for change email
  validateChangeEmailData({ newEmail }) {
    const errors = []
    if (!newEmail || !newEmail.includes('@')) errors.push('Email không hợp lệ')
    return errors
  }
}

export default new AuthService()