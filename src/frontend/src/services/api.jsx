import axiosInstance from './AxiosConfig'

// Helper function to handle API errors
const handleError = (error) => {
  throw new Error(error.response?.data?.detail || error.message || 'API request failed')
}

// Process file with OCR (removed progress callback and timeout)
export const processFile = async (file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const { data } = await axiosInstance.post('/process', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 0, // No timeout - let the request complete
    })

    return data
  } catch (error) {
    handleError(error)
  }
}

// Download processed file
export const downloadFile = async (filename) => {
  try {
    const { data } = await axiosInstance.get(`/download/${filename}`, {
      responseType: 'blob',
      timeout: 0, // No timeout for downloads
    })

    const url = URL.createObjectURL(new Blob([data]))
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  } catch (error) {
    handleError(error)
  }
}

// Delete processed file
export const deleteFile = async (fileId) => {
  try {
    const { data } = await axiosInstance.delete(`/file/${fileId}`, {
      timeout: 30000, // 30 seconds timeout for delete
    })
    return data
  } catch (error) {
    handleError(error)
  }
}

// Get file history
export const getFileHistory = async (skip = 0, limit = 20) => {
  try {
    const { data } = await axiosInstance.get('/history', {
      params: { skip, limit },
      timeout: 30000, // 30 seconds timeout for history
    })
    return data
  } catch (error) {
    handleError(error)
  }
}

// Check API health
export const checkApiHealth = async () => {
  try {
    const { status } = await axiosInstance.get('/', {
      timeout: 5000, // 5 seconds timeout for health check
    })
    return status === 200
  } catch {
    return false
  }
}