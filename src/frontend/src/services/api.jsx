// API Base URL - adjust this to match your FastAPI server
const API_BASE_URL = 'http://localhost:8000'

// Process file with OCR
export const processFile = async (file, onProgress) => {
  try {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`${API_BASE_URL}/process`, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to process file')
    }

    // Simulate progress for better UX
    if (onProgress) {
      let progress = 0
      const progressInterval = setInterval(() => {
        progress += 10
        onProgress(progress)
        if (progress >= 90) {
          clearInterval(progressInterval)
        }
      }, 200)
    }

    const result = await response.json()

    // Complete progress
    if (onProgress) {
      onProgress(100)
    }

    return result
  } catch (error) {
    throw new Error(error.message || 'Network error occurred')
  }
}

// Download processed file
export const downloadFile = async (filename) => {
  try {
    const response = await fetch(`${API_BASE_URL}/download/${filename}`)

    if (!response.ok) {
      throw new Error('Failed to download file')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    throw new Error(error.message || 'Download failed')
  }
}

// Get file history (placeholder - implement when backend supports it)
export const getFileHistory = async () => {
  try {
    // This endpoint doesn't exist in the current FastAPI app
    // Return empty array for now
    return []
  } catch (error) {
    throw new Error('Failed to fetch history')
  }
}

// Check API health
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/`)
    return response.ok
  } catch (error) {
    return false
  }
}