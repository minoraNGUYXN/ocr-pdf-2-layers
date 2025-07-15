import React, { useState } from 'react'
import FileUpload from '../../components/FileUpload/FileUpload'
import ProgressBar from '../../components/ProgressBar/ProgressBar'
import { processFile, downloadFile } from '../../services/api'
import './Upload.scss'

const Upload = () => {
  const [file, setFile] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [status, setStatus] = useState('idle') // idle, processing, completed, error
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Handle file selection
  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile)
    setError(null)
    setStatus('idle')
    setResult(null)
    setUploadProgress(0)
  }

  // Handle file processing
  const handleProcess = async () => {
    if (!file) return

    try {
      setStatus('processing')
      setError(null)
      setUploadProgress(0)

      const response = await processFile(file, setUploadProgress)
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
    setUploadProgress(0)
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
          <FileUpload
            onFileSelect={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png"
            disabled={status === 'processing'}
          />

          {file && (
            <div className="file-info">
              <div className="file-details">
                <div className="file-meta">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatFileSize(file.size)} MB</div>
                </div>
              </div>

              {status === 'idle' && (
                <div className="upload-actions">
                  <button className="btn btn-primary" onClick={handleProcess}>
                    Process File
                  </button>
                  <button className="btn btn-secondary" onClick={handleReset}>
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {status === 'processing' && (
            <div className="progress-section">
              <ProgressBar
                progress={uploadProgress}
                label="Processing file..."
                type="primary"
              />
            </div>
          )}

          {status === 'completed' && result && (
            <div className="result-section success">
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
            <div className="result-section error">
              <h3>Processing Failed</h3>
              <p>{error}</p>
              <button className="btn btn-primary" onClick={handleReset}>
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Upload