import React, { useState, useEffect } from 'react'
import { getFileHistory, downloadFile } from '../../services/api'
import AuthService from '../../services/AuthService'
import './History.scss'

const History = () => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState(null)

  // Check if user is authenticated
  useEffect(() => {
    if (!AuthService.isAuthenticated()) {
      setError('Please login to view history')
      setLoading(false)
      return
    }
    fetchHistory()
  }, [])

  // Fetch file history from API
  const fetchHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await getFileHistory()
      setHistory(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle file download
  const handleDownload = async (filename) => {
    try {
      setDownloading(filename)
      await downloadFile(filename)
    } catch (err) {
      setError(err.message)
    } finally {
      setDownloading(null)
    }
  }

  // Format file size
  const formatFileSize = (bytes) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB'
  }

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="history-page">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading history...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="history-page">
        <div className="container">
          <div className="error-container">
            <h3>Error Loading History</h3>
            <p>{error}</p>
            {AuthService.isAuthenticated() && (
              <button className="btn btn-primary" onClick={fetchHistory}>
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="history-page">
      <div className="container">
        <div className="header-section">
          <div className="header-content">
            <h1>File History</h1>
            <p className="subtitle">View all your processed files</p>
          </div>
          <button className="btn btn-secondary" onClick={fetchHistory}>
            Refresh
          </button>
        </div>

        {history.length === 0 ? (
          <div className="empty-state">
            <h3>No files processed yet</h3>
            <p>Start by uploading and processing your first file</p>
            <a href="/" className="btn btn-primary">
              Process File
            </a>
          </div>
        ) : (
          <div className="history-list">
            {history.map((file) => (
              <div key={file.id} className="history-item">
                <div className="file-info">
                  <div className="file-icon">
                    📄
                  </div>
                  <div className="file-details">
                    <h3 className="file-name">{file.original_filename}</h3>
                    <div className="file-meta">
                      <span className="file-size">{formatFileSize(file.file_size)}</span>
                      <span className="file-date">{formatDate(file.created_at)}</span>
                      <span className="download-count">
                        Downloaded {file.download_count} times
                      </span>
                      {file.processing_time && (
                        <span className="processing-time">
                          Processed in {file.processing_time.toFixed(2)}s
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="file-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => handleDownload(file.processed_filename)}
                    disabled={downloading === file.processed_filename}
                  >
                    {downloading === file.processed_filename ? 'Downloading...' : 'Download'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default History