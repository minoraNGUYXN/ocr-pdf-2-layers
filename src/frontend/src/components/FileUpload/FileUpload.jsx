import React, { useRef, useState } from 'react'
import './FileUpload.scss'

const FileUpload = ({ onFileSelect, accept, disabled }) => {
  const fileInputRef = useRef(null)
  const [dragActive, setDragActive] = useState(false)

  // Handle file selection
  const handleFileSelect = (files) => {
    if (files && files.length > 0) {
      const file = files[0]
      if (validateFile(file)) {
        onFileSelect(file)
      }
    }
  }

  // Validate file type and size
  const validateFile = (file) => {
    const acceptedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!acceptedTypes.includes(file.type)) {
      alert('Please select a PDF or image file (JPG, PNG)')
      return false
    }

    if (file.size > maxSize) {
      alert('File size must be less than 10MB')
      return false
    }

    return true
  }

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  // Handle click
  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className={`file-upload ${dragActive ? 'drag-active' : ''} ${disabled ? 'disabled' : ''}`}>
      <div
        className="upload-area"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <div className="upload-content">
          <p className="upload-text">
            Kéo thả tệp vào đây hoặc <span className="browse-link">bấm để chọn tệp</span>
          </p>
          <p className="file-types">Hỗ trợ file PDF, JPG, PNG (kích thước tối đa 10MB)</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={disabled}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  )
}

export default FileUpload