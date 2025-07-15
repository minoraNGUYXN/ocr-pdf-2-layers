
import React, { useState, useEffect } from 'react'
import { getFileHistory } from '../../services/api'
import './History.scss'

const History = () => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch history on component mount
  useEffect(() => {
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
            <button className="btn btn-primary" onClick={fetchHistory}>
              Try Again
            </button>
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
        </div>

        <div className="empty-state">
          <h3>History feature coming soon</h3>
          <p>History tracking will be available once the backend implements the history endpoint</p>
          <a href="/" className="btn btn-primary">
            Process File
          </a>
        </div>
      </div>
    </div>
  )
}

export default History