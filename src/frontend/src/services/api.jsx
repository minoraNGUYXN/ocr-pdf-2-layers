import axiosInstance from './AxiosConfig'

// Process file with OCR
export const processFile = async (file, onProgress) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await axiosInstance.post('/process', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(percentCompleted)
        }
      },
    })

    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to process file')
  }
}

// Download processed file
export const downloadFile = async (filename) => {
  try {
    const response = await axiosInstance.get(`/download/${filename}`, {
      responseType: 'blob',
    })

    const blob = new Blob([response.data])
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Download failed')
  }
}

// Get file history
export const getFileHistory = async (skip = 0, limit = 20) => {
  try {
    const response = await axiosInstance.get('/history', {
      params: { skip, limit }
    })
    return response.data
  } catch (error) {
    throw new Error(error.response?.data?.detail || 'Failed to fetch history')
  }
}

// Check API health
export const checkApiHealth = async () => {
  try {
    const response = await axiosInstance.get('/')
    return response.status === 200
  } catch (error) {
    return false
  }
}