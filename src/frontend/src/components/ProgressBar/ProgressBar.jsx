
import React from 'react'
import './ProgressBar.scss'

const ProgressBar = ({ progress, label, type = 'primary' }) => {
  return (
    <div className="progress-bar-container">
      {label && <div className="progress-label">{label}</div>}
      <div className="progress-bar">
        <div
          className={`progress-fill ${type}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <div className="progress-text">{Math.round(progress)}%</div>
    </div>
  )
}

export default ProgressBar