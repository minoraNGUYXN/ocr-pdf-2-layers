import React, { useState } from 'react'
import FileUpload from '../../components/FileUpload/FileUpload'
import { processFile, downloadFile } from '../../services/api'
import './Upload.scss'

const Upload = () => {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('idle') // idle, processing, completed, error
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Handle file selection
  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile)
    setError(null)
    setStatus('idle')
    setResult(null)
  }

  // Handle file processing
  const handleProcess = async () => {
    if (!file) return

    try {
      setStatus('processing')
      setError(null)

      const response = await processFile(file)
      setResult(response)
      setStatus('completed')

    } catch (err) {
      setError(err.message)
      setStatus('error')
    }
  }

  // Handle download
  const handleDownload = async () => {
    if (!result || !result.download_url) return

    try {
      // Extract filename from download_url
      const filename = result.download_url.split('/').pop()
      await downloadFile(filename)
    } catch (err) {
      setError(err.message)
    }
  }

  // Reset form
  const handleReset = () => {
    setFile(null)
    setStatus('idle')
    setResult(null)
    setError(null)
  }

  // Format file size
  const formatFileSize = (bytes) => {
    return (bytes / 1024 / 1024).toFixed(2)
  }

  return (
    <div className="upload-page">
      <div className="container">
        <div className="upload-header">
          <h1>OCR PDF Processor</h1>
          <p className="subtitle">Upload your PDF or image file for OCR processing</p>
        </div>

        <div className="upload-section">
          {/* Show file upload or unified process area */}
          {!file ? (
            <FileUpload
              onFileSelect={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png"
              disabled={status === 'processing'}
            />
          ) : (
            <div className="unified-process-area">
              {/* File info section */}
              <div className="file-info">
                <div className="file-icon">
                  <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 6C8 4.89543 8.89543 4 10 4H30L40 14V42C40 43.1046 39.1046 44 38 44H10C8.89543 44 8 43.1046 8 42V6Z" fill="#ff1744" fillOpacity="0.1"/>
                    <path d="M30 4V14H40" stroke="#ff1744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M8 6C8 4.89543 8.89543 4 10 4H30L40 14V42C40 43.1046 39.1046 44 38 44H10C8.89543 44 8 43.1046 8 42V6Z" stroke="#ff1744" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div className="file-details">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatFileSize(file.size)} MB</div>
                </div>
                {status === 'idle' && (
                  <button className="remove-file" onClick={handleReset} title="Remove file">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M15 5L5 15M5 5L15 15" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Status content area */}
              <div className="status-content">
                {status === 'idle' && (
                  <div className="upload-actions">
                    <button className="btn btn-primary" onClick={handleProcess}>
                      Process File
                    </button>
                    <button className="btn btn-secondary" onClick={handleReset}>
                      Choose Another File
                    </button>
                  </div>
                )}

                {status === 'processing' && (
                  <div className="processing-content">
                    <div className="spinner-container">
                      <div className="processing-spinner"></div>
                    </div>
                    <p className="processing-text">Processing your file...</p>
                    <p className="processing-subtext">Please wait, this may take a few moments</p>
                  </div>
                )}

                {status === 'completed' && result && (
                  <div className="result-content success">
                    <h3>Processing Complete!</h3>
                    <p>{result.message}</p>
                    <div className="result-actions">
                      <button className="btn btn-primary" onClick={handleDownload}>
                        Download OCR Result
                      </button>
                      <button className="btn btn-secondary" onClick={handleReset}>
                        Process Another File
                      </button>
                    </div>
                  </div>
                )}

                {status === 'error' && (
                  <div className="result-content error">
                    <h3>Processing Failed</h3>
                    <p>{error}</p>
                    <button className="btn btn-primary" onClick={handleReset}>
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Upload